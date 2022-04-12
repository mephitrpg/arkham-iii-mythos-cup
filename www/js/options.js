var options = {

    initialize: function() {
        
        if (!localStorage.getItem('options')) localStorage.setItem('options','{}');

        const def = {
            scenarioId: scenarios[0].getId(),
            lang: app.lang,
        };

        expansions.forEach(exp=>{
            const code = exp.getCode();
            if (code !== 'BASE') def[`exp${code}`] = true;
        });

        const options = _.defaults(this.readOptions(), def);
        
        this.saveOptions(options);
        
        _.each(options, (value, key) => { this[key] = value; });

        // html
        expansions.forEach((exp)=>{
            const code = exp.getCode();
            const show = code === 'BASE' ? ' style="display:none;"' : '';
            const ckAttr = code === 'BASE' ? ` checked="checked" disabled="disabled"` : ` id="options-exp${code}-switch"`;
            const title = `OPTION_EXPANSIONS_${code}_TITLE`;
            const description = `OPTION_EXPANSIONS_${code}_DESCRIPTION`;
            $('#app-options .app-content').append(
                `<div class="options-row"${show}>
                    <div>
                        <div data-lang="${title}"></div>
                        <div class="description" data-lang="${description}"></div>
                    </div>
                    <div class="switch-wrapper">
                        <label class="switch"><!-- disabled -->
                            <input type="checkbox"${ckAttr}>
                            <span class="slider round"></span>
                        </label>
                    </div>
                </div>`
            );
        });

        $('#app-options .app-content').append(
            `<div class="options-row" style="justify-content: center;"><button id="clear-data-button" class="btn" data-lang="CLEAR_DATA"></button></div>`
        );

        // lang
        makeSelector({
            element: document.getElementById('options-lang-selector'),
            options: _.map(languages, language => [language.getName(), language.getId()]),
            value: _.find(languages, language => language.getId() == this.readOption('lang')).getId(),
            onChange: 'options.onLangChange',
        });

        // investigators quantity
        makeSelector({
            element: document.getElementById('options-investigators-quantity-selector'),
            options: ['1', '2', '3', '4', '5', '6'],
            value: this.readOption('investigatorsQuantity') || '4',
            onChange: 'options.onInvestigatorsQuantityChange',
        });

         // expansions
         expansions.forEach(exp=>{
            const code = exp.getCode();
            const expElement = this[`exp${code}Element`] = document.getElementById(`options-exp${code}-switch`);
            if (!expElement) return;
            expElement.checked = this.readOption(`exp${code}`);
            expElement.addEventListener('change', this.onExpChange.bind(this, code));
        });

        // clear data
        document.getElementById('clear-data-button').addEventListener('click', event => {
            modalPrompt(()=>{
                localStorage.clear();
                location.reload();
            });
        });

    },

    saveOption: function(key, value){
        this[key] = value;
        const options = this.readOptions();
        options[key] = value;
        this.saveOptions(options);
    },

    saveOptions: function(options) {
        localStorage.setItem('options', JSON.stringify(options));
    },

    readOption: function(key){
        return this[key];
    },

    readOptions: function(name, value){
        return JSON.parse(localStorage.getItem('options'));
    },

    isExpansionAvailable(scenarioOrMonster) {
        const expId = scenarioOrMonster.getExpId();
        const expansion = expansions.find(expansion => expansion.getId() === expId);
        if (!expansion) return false;
        const EXP = expansion.getCode();
        if ( EXP === "BASE" ) return true;
        return this.readOption(`exp${EXP}`);
    },

    onLangChange: function (event) {
        const lang = event.target.value;
        options.saveOption('lang', lang);
        app.setLang(lang);
        app.renderScenario();
        app.applyLanguage();
    },

    onInvestigatorsQuantityChange: function (event) {
        const value = event.target.value;
        options.saveOption('investigatorsQuantity', value);
        app.renderScenario();
    },

    onExpChange: function(code, event) {
        this.saveOption(`exp${code}`, event.target.checked);
        populateSelector({
            element: app.scenarioSelector,
            options: app.getAvailableScenarios().map(scenario => [scenario.getName(), scenario.getId()]),
        });
    },

}
