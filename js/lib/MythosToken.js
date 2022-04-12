class MythosToken {
    constructor(data) {
        this.data = _.defaults(data, {
            latest: true,
            beforeLatest: true,
            apart: false,
            slug: _.reduce(data.name, (memo, value, key) => {
                return {...memo, [key]: _s(value).slugify().value()}
            }, {}),
        });
        return this;
    }
    getId(){
        return this.data.name.en;
    }
    getName(lang){
        return this.data.name[lang || app.lang];
    }
    getSlug(lang){
        return this.data.slug[lang || app.lang];
    }
    getIcon(){
        return this.data.icon;
    }
    isLatest(flag){
        if (typeof flag !== 'boolean') return this.data.latest;
        this.data.latest = flag;
    }
    isBeforeLatest(flag){
        if (typeof flag !== 'boolean') return this.data.beforelatest;
        this.data.beforelatest = flag;
    }
    setApart(flag){
        if (typeof flag !== 'boolean') return this.data.apart;
        this.data.apart = flag;
    }
    toJSON() {
        return JSON.parse(JSON.stringify(this.data));
    }
    clone(){
        return new MythosToken(this.toJSON());
    }
}