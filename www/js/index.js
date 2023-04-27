var _s = s;
var app_started = new Date();

function isBrowser() {
    return device.platform === 'browser';
}

function isAndroid() {
    if (!isBrowser()) return device.platform === "Android";
    return !!navigator.userAgent.match(/Android/);
}

function isIOS() {
    if (!isBrowser()) device.platform === "iOS";
    return !!( navigator.userAgent.match(/iPhone/) || navigator.userAgent.match(/iPad/) );
}

function isDesktop() {
    return !isMobile();
}

function isMobile() {
    if (isAndroid()) return true;
    if (isIOS()) return true;
    const platform = device.platform;
    if (platform === 'WinCE') return true;
    if (platform === 'Tizen') return true;
    if (platform === 'BlackBerry 10') return true;
    return false;
}

function filePath(path) {
    return ( isAndroid() ? "/android_asset/www" : "" ) + path;
}

function setPseudoElContent(selector, value) {    
    document.styleSheets[0].addRule(selector, 'content: "' + value + '";');
}

function makeTabs(tabs) {
    tabs.forEach(tab => {
        const [ button, content, callback ] = tab;
        button.addEventListener('click', () => {
            tabs.forEach(tb => {
                const [ btn, cnt ] = tb;
                btn.classList.remove('active');
                cnt.classList.remove('active');
                cnt.style.display = 'none';
            });
            button.classList.add('active');
            content.classList.add('active');
            content.style.display = 'block';
            if (typeof callback === 'function') callback(button, content);
        });
    });
    const [ firstButton ] = tabs[0];
    firstButton.dispatchEvent(new Event('click'));
}

function makeSelector(options) {

    options = _.defaults(options, {
        element: null,
        options: [],
        value: null,
        onChange: '',
        trigger: true,
    });

    const selectorElement  = options.element;
    const selectorOptions  = options.options.map(item => Array.isArray(item) ? item : [item, item]);
    const selectedValue    = (_.isUndefined(options.value) || _.isNull(options.value)) ? selectorElement.value : options.value;
    const onChangeFuncPath = options.onChange;
    const triggerChange    = options.trigger;
    
    selectorElement.classList.add('selector');
    selectorElement.classList.add('hidden-selector');
    selectorElement.setAttribute('data-onchange', onChangeFuncPath);

    const linkElement = document.createElement('span');
    linkElement.classList.add('hidden-selector-link');
    selectorElement.parentNode.appendChild(linkElement);

    const styleElement = document.createElement('style');
    styleElement.id = selectorElement.id + '-style';
    document.querySelector('head').appendChild(styleElement);

    if (isBrowser()) {

        linkElement.addEventListener('click', (ev) => {
            selectorElement.setAttribute('size', selectorElement.options.length);
            selectorElement.classList.remove('hidden-selector');
            selectorElement.classList.add('browser-selector');
            selectorOverlay(selectorElement, true);
        });

        selectorElement.addEventListener('click', (ev) => {
            const target = ev.target;
            if (target.tagName.toLowerCase() !== 'option') return;
            if (!target.selected) return;
            selectorElement.dispatchEvent(new Event('change'));
        });

        selectorElement.addEventListener('change', () => {
            selectorElement.classList.remove('browser-selector');
            selectorElement.classList.add('hidden-selector');
            linkElement.textContent = selectorElement.options[selectorElement.selectedIndex].text;

            selectorOverlay(selectorElement, false);

            document.getElementById(`${selectorElement.id}-style`).innerHTML = `
                #${selectorElement.id} option:nth-child(${selectorElement.selectedIndex + 1})::before {
                    content: "${selectorElement.options[selectorElement.selectedIndex].text}";
                }
            `;

        });

    } else {

        linkElement.addEventListener('click', (ev) => {
            var e = document.createEvent('MouseEvents');
            e.initMouseEvent('mousedown', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
            selectorElement.dispatchEvent(e);
        });
    
        selectorElement.addEventListener('change', () => {
            linkElement.textContent = selectorElement.options[selectorElement.selectedIndex].text;
        });
    
    }

    populateSelector(options);

}

function populateSelector(options) {

    options = _.defaults(options, {
        element: null,
        options: [],
        value: null,
        onChange: '',
        trigger: true,
    });

    if (!_.has(options.element.dataset, 'onchange')) throw new Error("Elemento non inizializzato");

    const selectorElement  = options.element;
    const selectorOptions  = options.options.map(item => Array.isArray(item) ? item : [item, item]);
    const selectedValue    = (_.isUndefined(options.value) || _.isNull(options.value)) ? selectorElement.value : options.value;
    const onChangeFuncPath = options.onChange;
    const triggerChange    = options.trigger;

    // individua la funzione onchange
    let funcPath = onChangeFuncPath || selectorElement.getAttribute('data-onchange');
    funcPath = funcPath.split('.');
    const that = _.get(window, funcPath[0]);
    const func = _.get(window, funcPath).bind(that);
    
    // rimuovi il listener onchange
    selectorElement.removeEventListener('change', func);

    // svuota le options
    let i = selectorElement.length;
    while (i--) selectorElement.remove(i);

    // aggiungi le options
    selectorOptions.sort((a, b) => a[0].localeCompare(b[0], this.lang));
    selectorOptions.forEach(so => {
        const [ text, value ] = so;
        selectorElement.add(new Option(text, value));
    });

    // setta la option
    selectorElement.value = selectedValue;

    // se la option non esiste più, setta la prima
    if (selectorElement.selectedIndex === -1) selectorElement.selectedIndex = 0;

    // setta il testo del link
    const linkElement = selectorElement.parentNode.querySelector('span');
    linkElement.textContent = selectorElement.options[selectorElement.selectedIndex].text;

    selectorElement.addEventListener('change', func);

    if (triggerChange) selectorElement.dispatchEvent(new Event('change'));

}

function renameSelectorOptions(options) {

    options = _.defaults(options, {
        element: null,
        options: [],
    });

    const selectorElement  = options.element;
    const selectorOptions  = options.options.map(item => Array.isArray(item) ? item : [item, item]);

    selectorOptions.sort((a, b) => {
        return a[0].localeCompare(b[0], app.lang);
    });

    _.each(selectorElement.options, opt => {
        const match = _.find(selectorOptions, pair => pair[1] === opt.value);
        if (match) opt.text = match[0];
    });
    
    const $selectorElement = $(selectorElement);
    
    selectorOptions.forEach(pair => {
        const [ text, value ] = pair;
        const optionElement = Array.from(selectorElement.options).find(optEl => optEl.value === value);
        $selectorElement.append(optionElement);
    });

    if (!_.has(selectorElement.dataset, 'onchange')) return;

    const linkElement = selectorElement.parentNode.querySelector('span');
    if (selectorElement.selectedIndex !== -1) {
        linkElement.textContent = selectorElement.options[selectorElement.selectedIndex].text;
    } else {
        linkElement.textContent = '';
    }
}

function modal(content, options) {
    options = _.defaults(options, {
        open: true,
        animate: true,
        autoclose: null,
        closeOnOverlayClick: true,
        onOpen: function(){},
        onClose: function(){},
        duration: 400
    });

    const parentTab = document.querySelector('.js-tab-content.active');
    let overlayElement = parentTab.querySelector('.overlay');
    const exists = !!overlayElement;

    if (!exists) {
        overlayElement = document.createElement('div');
        overlayElement.classList.add('overlay');
    }

    const callback = options.open ? options.onOpen.bind(this, overlayElement) : options.onClose.bind(this, overlayElement);

    if (content) {
        overlayElement.innerHTML = '';
        if (typeof content === 'string') overlayElement.innerHTML = content;
        else overlayElement.appendChild(content);
    }

    if (options.animate) {
        overlayElement.style.cssText = `-webkit-transition-duration: ${options.duration}ms; transition-duration: ${options.duration}ms;`;
    } else {
        overlayElement.style.cssText = '';
    }

    if (!exists) {
        parentTab.appendChild(overlayElement);
        overlayElement.addEventListener('click', (event) => {
            if (options.closeOnOverlayClick && event.target === overlayElement) modal(null, Object.assign({}, options, {open: false}));
        });
    }

    if (options.open) {
        overlayElement.classList.remove('overlay-hidden');
        if (typeof options.autoclose === 'number' && options.autoclose >= 0) {
            setTimeout(() => {
                modal(null, Object.assign({}, options, {open: false}));    
            }, options.autoclose);
        }
    } else {
        overlayElement.classList.add('overlay-hidden');
    }

    if (options.animate) {
        setTimeout(callback, options.duration);
    } else {
        callback();
    }

    return overlayElement;
}

function modalPrompt(callback = function(){}) {
    const content = `
        <p>${l('ARE_YOU_SURE')}</p>
        <p><button class="btn" data-choice="0">${l('NO')}</button><button class="btn" data-choice="1">${l('YES')}</button></p>
    `;
    modal(content, {
        closeOnOverlayClick: false,
        onOpen: (overlayElement) => {
            function onClick(event) {
                const choice = event.target.getAttribute('data-choice');
                if (!choice) return;
                overlayElement.removeEventListener('click', onClick);
                if (Number(choice)) {
                    callback();
                }
                modal(null, {open: false});
            }
            overlayElement.addEventListener('click', onClick);
        }
    });
}

function selectorOverlay(selectorElement, show) {

    const parentTab = $(selectorElement).closest('.js-tab-content').get(0);
    let overlayElement = parentTab.querySelector('.browser-selector-overlay');

    if (!overlayElement) {

        overlayElement = document.createElement('div');
        overlayElement.classList.add('browser-selector-overlay');
        overlayElement.style.display = 'none';
        // parentTab.insertBefore(overlayElement, parentTab.children[0]);
        parentTab.appendChild(overlayElement);

        overlayElement.addEventListener('click', () => {
            selectorElement.dispatchEvent(new Event('change'));
        });

    }

    let tabBar = document.getElementById('tab-bar');
    
    if (show) {
        overlayElement.style.display = 'block';
        tabBar.style.pointerEvents = 'none';
        tabBar.style.opacity = 0.7;
    } else {
        overlayElement.style.display = 'none' ;
        tabBar.style.pointerEvents = 'auto';
        tabBar.style.opacity = 1;
    }

}

function l(str) {
    const len = arguments.length;
    str = app.currentLanguage.getString(str);
    for (let i = len - 1; i > 0; i--) {
        str = str.split('%' + i).join(arguments[i]);
    }
    return str;
}

var app = {

    // Application Constructor
    initialize: function() {

        languages = _.each(languages, (item, id) => { languages[id] = new Language(item); });

        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
        document.addEventListener("pause", this.onPause.bind(this), false);
        document.addEventListener("resume", this.onResume.bind(this), false);

    },

    setLang: function(langId) {
        this.lang = langId;
        this.currentLanguage = _.find(languages, language => language.getId() === langId);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {

        const defaultLang = _.find(languages, language => language.isDefault());
        navigator.globalization.getLocaleName((locale) => {
            const currentLang = locale.value.split(',')[0].split('-')[0];
            const supportedLang = _.find(languages, language => language.getId() === currentLang);
            this.setLang(supportedLang ? supportedLang.getId() : defaultLang.getId());
            this.prepareApp();
        }, (e) => {
            console.error(e);
            this.setLang(defaultLang.getId());
            this.prepareApp();
        });

    },

    prepareApp: function() {

        expansions   = expansions.map(item => new Expansion(item));
        mythosTokens = mythosTokens.map(item => new MythosToken(item));
        scenarios    = scenarios.map(item => new Scenario(item));

        const that = this;

        this.isEditing                 = false;
        this.firstAppRun               = !localStorage.getItem('mythosCup');

        this.tabElements               = {};
        this.tabContentElements        = {};
        this.appElement                = document.getElementById('app');
        this.scenarioSelector          = document.getElementById('scenario-selector');
        this.investigatorsElement      = document.getElementById('investigators');
        this.mythosCupElement          = document.getElementById('mythos-cup');
        this.mythosCupEditElement      = document.getElementById('cup-edit');
        this.mythosCupArrowElement     = document.getElementById('cup-arrow');
        this.mythosCupArrowAreaElement = document.getElementById('cup-arrow-area');
        this.addTokensElement          = document.getElementById('cup-tokens-add');
        this.drawnElement              = document.getElementById('cup-tokens-drawn');
        this.cupBarElement             = document.getElementById('cup-bar');
        this.investigatorIndex         = undefined;

        document.querySelectorAll('[data-tab-key]').forEach(tabElement => {
            const tabKey = tabElement.getAttribute('data-tab-key');
            this.tabElements[tabKey] = document.querySelector('[data-tab-key="' + tabKey + '"]');
            this.tabContentElements[tabKey] = document.querySelector('[data-tab-content-key="' + tabKey + '"]');
        });

        // metadati della mythos cup
        this.metadata = new MythosCupMetadata();

        // lista di token nella mythos cup
        this.mythosCup = new MythosCup();

        // token pescati dagli investigatori
        this.investigatorsTokens = new InvestigatorsTokens();

        modal(null, {open: false});

        options.initialize();

        this.investigatorsElement.addEventListener('click', event => {
            const element = event.target;

            if (element.tagName.toLowerCase() === 'button') {
                const index = element.getAttribute('data-index');
                this.drawMythosToken(document.querySelector(`.investigator[data-index="${index}"]`));
                return;
            }
            
            if (!this.isEditing) {
                return;
            }

            const tokenElement = $(element).closest('.investigator-token').get(0);
            const investigatorElement = $(tokenElement).closest('.investigator').get(0);
            if (tokenElement && investigatorElement) {
                const tokenIndex = tokenElement.getAttribute('data-index');
                const investigatorIndex = investigatorElement.getAttribute('data-index');
                this.deleteTokenAtIndexFromInvestigator(tokenIndex, investigatorIndex);
                this.renderScenario();
            }

        });

        this.mythosCupArrowAreaElement.addEventListener('click', event => {
            this.isEditing = !this.isEditing;
            this.mythosCupArrowElement.style.cssText = this.mythosCupArrowElement.style.cssText ? '' : 'transform: rotate(180deg);';
            $(this.mythosCupEditElement).slideToggle();
            $('#message-drawn-tokens').slideToggle();
        });

        this.addTokensElement.querySelectorAll('.cup-token').forEach(token => {
            token.addEventListener('click', function(event) {
                if (!that.isEditing) return;
                const tokenId = this.getAttribute('data-token-id');
                if (that.insertTokenIntoMythosCup(tokenId)) {
                    that.renderScenario();
                }
            });
        });

        this.drawnElement.querySelectorAll('.cup-token').forEach(token => {
            token.addEventListener('click', function(event) {
                if (!that.isEditing) return;
                const tokenId = this.getAttribute('data-token-id');
                if (that.deleteTokenFromMythosCup(tokenId)) {
                    that.renderScenario();
                }
            });
        });

        document.getElementById('new-round-button').addEventListener('click', () => {
            modalPrompt(()=>{
                this.investigatorsTokens.ref().forEach(investigator => {
                    investigator.mythosTokens.forEach(token => {
                        token.setApart(true);
                    });
                });
                this.investigatorsTokens.write();
                this.renderScenario();
            });
        });

        document.getElementById('refill-cup-button').addEventListener('click', () => {
            modalPrompt(()=>{
                this.generateMythosCup();
                this.renderScenario();
            });
        });

        this.onAppReady();
    },

    // Update DOM on a Received Event
    onAppReady: function() {

        this.appElement.style.visibility = 'visible';
        // this.sound('bg', 12000);
        
        // tab bar
        makeTabs(Object.keys(this.tabContentElements).map(tabKey => [
                this.tabElements[tabKey],
                this.tabContentElements[tabKey],
                this.onTabActive[tabKey].bind(this),
        ]));

        makeSelector({
            element: this.scenarioSelector,
            options: this.getAvailableScenarios().map(scenario => [scenario.getName(), scenario.getId()]),
            value: options.readOption('scenarioId'),
            onChange: 'app.selectScenario',
        });

        this.applyLanguage();

        (function hideSplashScreen() {
            if (new Date() - app_started < 2000 ) setTimeout(hideSplashScreen, 20);
            else navigator.splashscreen.hide();
        })();

    },

    applyLanguage: function() {

        // document.querySelector('html').className = this.lang;

        document.querySelectorAll('[data-lang]').forEach(element => {
            const str = element.getAttribute('data-lang');
            element.innerHTML = l(str);
        });

        renameSelectorOptions({
            element: this.scenarioSelector,
            options: this.getAvailableScenarios().map(scenario => [scenario.getName(), scenario.getId()]),
        });

    },

    onPause: function() {

    },

    onResume: function() {

    },

    onTabActive: {
        'bag': function() {

        },
        'options': function() {

        },
    },

    selectScenario: function(event) {
        const noScenarioSelected = !this.scenario;
        const yesScenarioSelected = !noScenarioSelected;
        const scenarioId = event.target.value;
        options.saveOption('scenarioId', scenarioId);
        const scenario = this.scenario = this.getScenarioById(scenarioId);
        if (!noScenarioSelected) {
            this.generateMythosCup();
        } else if (this.firstAppRun) {
            this.generateMythosCup();
        }
        this.renderScenario();
    },

    getScenarioById: function(id) {
        return scenarios.find(scenario => {
            return scenario.getId() === id;
        });
    },

    getAvailableScenarios: function() {
        return _.filter(scenarios, scenario => options.isExpansionAvailable(scenario));
    },

    renderScenario: function() {
        if (this.scenario) {
            this.drawnElement.querySelectorAll('.cup-token').forEach(tokenElement => {
                const tokenId = tokenElement.getAttribute('data-token-id');
                const tot = this.metadata.quantity(tokenId);
                const currOut = this.investigatorsTokens.quantity(tokenId);
                const currIn = tot - currOut;
                let initialDisplay = tokenElement.getAttribute('data-css-display');
                if (!initialDisplay) {
                    initialDisplay = getComputedStyle(tokenElement).display;
                    tokenElement.setAttribute('data-css-display', initialDisplay);
                }
                tokenElement.style.display = tot ? initialDisplay : 'none';
                const totElement = tokenElement.querySelector('.cup-token-tot');
                let dots = '';
                const dotOpacityIfNotZero = currIn ? 0.4 : 1;
                for (let i = 0; i < tot; i++) dots += `<span style="opacity: ${i < currIn ? 1 : dotOpacityIfNotZero}">•</span>`;
                totElement.innerHTML = `<div class="cup-token-dots">${dots}</div>`;
                tokenElement.style.opacity = currIn ? 1 : 0.4;
            });
            const total = this.metadata.ref().reduce((result, token) => result + token.quantity, 0);
            const current = this.mythosCup.ref().length;
            const perc = current / total * 100;
            this.cupBarElement.style.cssText = (
                `background-image: -webkit-linear-gradient(90deg, rgba(139,94,59,1) 0%, rgba(139,94,59,1) ${perc}%, rgba(0,0,0,1)  ${perc}%, rgba(0,0,0,1) 100%);` +
                `background-image: linear-gradient(90deg, rgba(139,94,59,1) 0%, rgba(139,94,59,1)  ${perc}%, rgba(0,0,0,1)  ${perc}%, rgba(0,0,0,1) 100%);`
            );

            this.cupBarElement.innerHTML = `${current} / ${total}`;

            let investigatorsList = '';
            const q = Number(options.readOption('investigatorsQuantity'));
            for(let i = 0; i < q; i++) {
                const tokens = this.investigatorsTokens.getByInvestigator(i);
                const tokensLen = tokens.length;
                const drawn = this.investigatorsTokens.drawn(i) || '';
                const badge = String.fromCharCode(65 + i); // A B C ...
                investigatorsList += `
                <li class="investigator" data-index="${i}">
                    <div class="investigator-title">
                        <div><span class="icon ah3-investigator"></span></div>
                        <div>&nbsp;<sub>${badge}</sub></div>
                        <div></div>
                    </div>
                    <div class="investigator-tokens">${tokens.map((token, t, arr) => {
                        const beforelast = token.isBeforeLatest() ? 'investigator-token-latest' : '' ;
                        const apart = token.setApart() ? 'investigator-token-apart' : '';
                        let result = '';
                        if (drawn) {
                            if (tokensLen - drawn === t || (t === 0 && drawn > tokensLen)) {
                                result += `
                                <div class="investigator-token-separator">
                                    <div class="investigator-token-separator-number">${drawn}</div>
                                    <div class="investigator-token-separator-arrow">▶</div>
                                </div>`;
                            }
                        }
                        result += `<div class="investigator-token ${beforelast} ${apart}" data-index="${t}"><span class="icon ah3-${token.getIcon()}"></span></div>`;
                        return result;
                    }).join('')}</div>
                    <div class="investigator-actions">
                        <button data-index="${i}">+</button>
                    </div>
                </li>
                `;
            }
            this.investigatorsElement.innerHTML = investigatorsList;
            
            // animate

            for(let i = 0; i < q; i++) {
                this.investigatorsTokens.getByInvestigator(i).forEach((token, t) => {
                    if (!token.isLatest()) return;
                    const investigatorTokensElement = this.investigatorsElement.querySelector(`.investigator[data-index="${i}"] .investigator-tokens`);
                    setTimeout(() => {
                        const children = investigatorTokensElement.querySelectorAll('.investigator-token');
                        document.querySelector('.investigator-token-latest')?.classList.remove('investigator-token-latest');
                        children[t].classList.add('investigator-token-latest');
                    }, 0);
                });
            }
        }
    },

    insertTokenIntoMythosCup(tokenId) {
        const token = mythosTokens.find(item => item.getId() === tokenId);
        console.log(tokenId,"+",token)
        if (!token) return false;
        this.metadata.increment(tokenId);
        this.mythosCup.add(token.clone());
        return true;
    },

    deleteTokenFromMythosCup(tokenId) {
        const tokenIndex = this.mythosCup.findIndex(tokenId);
        console.log(tokenId,"-",tokenIndex)
        if (tokenIndex === -1) return false;
        this.metadata.decrement(tokenId);
        this.mythosCup.removeAt(tokenIndex);
        return true;
    },
    
    deleteTokenAtIndexFromInvestigator(tokenIndex, investigatorIndex) {
        const token = this.investigatorsTokens.removeAt(tokenIndex, investigatorIndex);
        this.metadata.decrement(token.getId());
    },
    
    generateMythosCup() {
        this.investigatorsTokens.reset();
        this.metadata.reset(this.scenario.getMythosCup());
        this.mythosCup.reset(this.metadata.ref().reduce((list, scenarioTokenData) => {
            const mythosToken = mythosTokens.find(mythosToken => mythosToken.getId() === scenarioTokenData.id);
            for (let i = 0; i < scenarioTokenData.quantity; i++) list.push(mythosToken.toJSON());
            return list;
        }, []));
    },

    drawMythosToken(investigatorElement) {
        const investigatorIndex = this.investigatorIndex = Number(investigatorElement.getAttribute('data-index'));

        if (!this.mythosCup.quantity()) {
            const d = this.investigatorsTokens.drawn(investigatorIndex);
            console.log('d',this.investigatorsTokens.drawn(investigatorIndex))
            this.generateMythosCup();
            this.investigatorsTokens.drawn(investigatorIndex, d);
            console.log('d',this.investigatorsTokens.drawn(investigatorIndex))
        }

        const token = this.mythosCup.draw();
        
        const modalContent = `<img src="img/token_${token.getIcon()}.png" class="token-big">`;
        this.modalToken = token; // avoid always return the same token onclose
        modal(modalContent, {
            autoclose: 800,
            onClose: () => {
                this.investigatorsTokens.add(token, this.investigatorIndex);
                this.renderScenario();
            }
        });
    },
    
};

app.initialize();