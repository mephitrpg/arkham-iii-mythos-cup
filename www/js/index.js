var _s = s;
var app_started = new Date();

// https://github.com/joepie91/node-random-number-csprng#readme
function rand(min, max) {
    var i = rval = bits = bytes = 0;
    var range = max - min;
    if (range < 1) {
        return min;
    }
    if (window.crypto && window.crypto.getRandomValues) {
        // Calculate Math.ceil(Math.log(range, 2)) using binary operators
        var tmp = range;
        /**
         * mask is a binary string of 1s that we can & (binary AND) with our random
         * value to reduce the number of lookups
         */
        var mask = 1;
        while (tmp > 0) {
            if (bits % 8 === 0) {
                bytes++;
            }
            bits++;
            mask = mask << 1 | 1; // 0x00001111 -> 0x00011111
            tmp = tmp >>> 1;      // 0x01000000 -> 0x00100000
        }
        
        var values = new Uint8Array(bytes);
        do {
            window.crypto.getRandomValues(values);
            
            // Turn the random bytes into an integer
            rval = 0;
            for (i = 0; i < bytes; i++) {
                rval |= (values[i] << (8 * i));
            }
            // Apply the mask
            rval &= mask;
            // We discard random values outside of the range and try again
            // rather than reducing by a modulo to avoid introducing bias
            // to our random numbers.
        } while (rval > range);
        
        // We should return a value in the interval [min, max]
        return (rval + min);
    } else {
        // CSPRNG not available
        return min + Math.floor(Math.random() * range)
    }
}

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

    selectorOptions.sort((a, b) => a[0].localeCompare(b[0], app.lang));

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

function selectorOverlay(selectorElement, show) {

    const parentTab = $(selectorElement).closest('.js-tab-content').get(0);
    let overlayElement = parentTab.querySelector('.browser-selector-overlay');

    if (!overlayElement) {

        overlayElement = document.createElement('div');
        overlayElement.classList.add('browser-selector-overlay');
        overlayElement.style.display = 'none';
        // parentTab.insertBefore(overlayElement, parentTab.children[0]);
        parentTab.appendChild(overlayElement);

        overlayElement.addEventListener('click', ($ev) => {
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

        this.appElement               = document.getElementById('app');
        this.tabElements              = {};
        this.tabContentElements       = {};
        document.querySelectorAll('[data-tab-key]').forEach(tabElement => {
            const tabKey = tabElement.getAttribute('data-tab-key');
            this.tabElements[tabKey] = document.querySelector('[data-tab-key="' + tabKey + '"]');
            this.tabContentElements[tabKey] = document.querySelector('[data-tab-content-key="' + tabKey + '"]');
        });
        this.scenarioSelector         = document.getElementById('scenario-selector');

        this.investigatorsElement     = document.getElementById('investigators');
        this.investigatorsElement.addEventListener('click', event => {
            const element = event.target;
            if (element.tagName.toLowerCase() === 'button') {
                const index = element.getAttribute('data-index');
                this.drawMythosToken(document.querySelector(`.investigator[data-index="${index}"]`));

            }
        });
        this.drawnElement             = document.getElementById('cup-tokens-drawn');
        this.drawnElement.querySelectorAll('.cup-token').forEach(drawnTokenElement => {
            drawnTokenElement.addEventListener('click', event => {
                
                const tokenId = drawnTokenElement.getAttribute('data-token-id');
                this.insertTokenIntoMythosCup(tokenId);
                this.renderScenario();
            });
        });

        this.cupBarElement            = document.getElementById('cup-bar');

        document.getElementById('new-turn-button').addEventListener('click', () => {

        });

        document.getElementById('refill-cup-button').addEventListener('click', () => {

        });

        expansions = expansions.map(item => new Expansion(item));
        mythosTokens = mythosTokens.map(item => new MythosToken(item));
        scenarios = scenarios.map(item => new Scenario(item));

        this.investigators = this.readInvestigators();
        this.mythosCup = this.readMythosCup();
        this.editableMythosCupData = this.readEditableMythosCupData();

        options.initialize();

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
        const isFirstTime = !this.scenario;
        const scenarioId = event.target.value;
        options.saveOption('scenarioId', scenarioId);
        const scenario = this.scenario = this.getScenarioById(scenarioId);
        if (!isFirstTime) {
            this.generateMythosCup();
        } else if (!localStorage.getItem('mythosCup')) {
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
        let investigatorsList = '';
        if (this.scenario) {
            const q = Number(options.readOption('investigatorsQuantity'));
            for(let i = 0; i < q; i++) {
                investigatorsList += `
                <li class="investigator" data-index="${i}">
                    <div class="investigator-title"><span class="icon ah3-investigator"></span>&nbsp;<sub>${i+1}</sub></div>
                    <div class="investigator-tokens">${this.investigators[i].map(token => {
                        return `<div class="investigator-token"><span class="icon ah3-${token.getIcon()}"></span></div>`;
                    }).join('')}</div>
                    <div class="investigator-actions">
                        <button data-index="${i}">+</button>
                    </div>
                </li>
                `;
            }
            this.drawnElement.querySelectorAll('.cup-token').forEach(tokenElement => {
                const tokenId = tokenElement.getAttribute('data-token-id');
                const curr = this.mythosCup.filter(item => item.getId() === tokenId).length;
                const tot = this.editableMythosCupData.find(item => item.id === tokenId)?.quantity || 0;
                const totElement = tokenElement.querySelector('.cup-token-tot');
                let dots = '';
                const dotOpacityIfNotZero = curr ? 0.4 : 1;
                for (let i = 0; i < tot; i++) dots += `<span style="opacity: ${i < curr ? 1 : dotOpacityIfNotZero}">•</span>`;
                totElement.innerHTML = `<div class="cup-token-dots">${dots}</div>`;
                tokenElement.style.opacity = curr ? 1 : 0.4;
            });
            const total = this.editableMythosCupData.reduce((result, item) => result + item.quantity, 0);
            const current = this.mythosCup.length;
            const perc = current / total * 100;
            this.cupBarElement.style.cssText = (
                `background-image: -webkit-linear-gradient(90deg, rgba(139,94,59,1) 0%, rgba(139,94,59,1) ${perc}%, rgba(0,0,0,1)  ${perc}%, rgba(0,0,0,1) 100%);` +
                `background-image: linear-gradient(90deg, rgba(139,94,59,1) 0%, rgba(139,94,59,1)  ${perc}%, rgba(0,0,0,1)  ${perc}%, rgba(0,0,0,1) 100%);`
            );
            this.cupBarElement.innerHTML = `${current} / ${total}`;
        }
        this.investigatorsElement.innerHTML = investigatorsList;
    },

    howManyTokensById(tokenId) {
        const token = this.editableMythosCupData.find(token => token.id === tokenId);
        return token ? token.quantity : 0;
    },

    insertTokenIntoMythosCup(tokenId) {
        const tokenData = this.editableMythosCupData.find(token => token.id === tokenId);
        if (tokenData) {
            tokenData.quantity++;
            this.writeEditableMythosCupData();
            const token = mythosTokens.find(item => item.getId() === tokenData.id);
            this.addTokenToMythosCup(token.clone());
        }
    },

    deleteTokenFromMythosCup(tokenId) {
        const token = this.editableMythosCupData.find(token => token.id === tokenId);
        if (token && token.quantity) {
            token.quantity--;
            this.writeEditableMythosCupData();
        }
    },

    writeEditableMythosCupData() {
        const data = this.editableMythosCupData;
        localStorage.setItem('editableMythosCupData', JSON.stringify(data));
        return data;
    },

    readEditableMythosCupData() {
        const data = localStorage.getItem('editableMythosCupData');
        if (!data) return [];
        return JSON.parse(data);
    },
    
    generateMythosCup() {
        this.resetInvestigators();
        this.resetMythosCup();
        this.resetEditableMythosCupData();
        this.editableMythosCupData.map(scenarioToken => {
            const mythosToken = mythosTokens.find(mythosToken => {
                return mythosToken.getId() === scenarioToken.id;
            });
            for (let i = 0; i < scenarioToken.quantity; i++) {
                this.addTokenToMythosCup(mythosToken.clone());
            }
        });
        this.writeMythosCup();
    },

    drawMythosToken(investigatorElement) {

        if (!this.mythosCup.length) {
            this.generateMythosCup();
        }

        const token = this.drawTokenFromMythosCup();
        const investigatorIndex = investigatorElement.getAttribute('data-index');
        this.addTokenToInvestigator(token, investigatorIndex);

        this.renderScenario();
    },

    resetInvestigators() {
        this.investigators = [[],[],[],[],[],[]];
        this.writeInvestigators();
        return this.investigators;
    },

    readInvestigators() {
        const investigators = localStorage.getItem('investigators');
        if (!investigators) return [[],[],[],[],[],[]];
        return JSON.parse(investigators).map(investigator => investigator.map(data => new MythosToken(data)));
    },

    writeInvestigators() {
        const inv = this.investigators.map(investigator => investigator.map(token => token.data));
        localStorage.setItem('investigators', JSON.stringify(inv));
    },

    addTokenToInvestigator(token, investigatorIndex) {
        this.investigators[investigatorIndex].push(token);
        this.writeInvestigators();
    },

    resetMythosCup() {
        this.mythosCup = [];
        this.writeMythosCup();
        return this.mythosCup;
    },

    resetEditableMythosCupData() {
        this.editableMythosCupData = this.scenario.getMythosCup();
        this.writeEditableMythosCupData();
        return this.editableMythosCupData;
    },

    readMythosCup() {
        const mythosCup = localStorage.getItem('mythosCup');
        if (!mythosCup) return [];
        return JSON.parse(mythosCup).map(data => new MythosToken(data));
    },

    writeMythosCup() {
        localStorage.setItem('mythosCup', JSON.stringify(this.mythosCup.map(token => token.data)));
    },

    addTokenToMythosCup(token) {
        this.mythosCup.push(token);
        this.writeMythosCup();
    },

    drawTokenFromMythosCup() {
        const tokenIndex = rand(0, this.mythosCup.length - 1);
        const [token] = this.mythosCup.splice(tokenIndex, 1);
        // this.addToOverallTokens(token);
        this.writeMythosCup();
        return token;
    },

    // addToOverallTokens(token) {
    //      badges
    // },

    
};

app.initialize();