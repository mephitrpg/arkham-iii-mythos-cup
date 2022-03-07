class MythosToken {
    constructor(data) {
        console.log(data);
        this.data = data;
        data.slug = {};
        Object.keys(data.name).forEach(l => {
            data.slug[l] = _s(data.name[l]).slugify().value();
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
    clone(){
        return new MythosToken(JSON.parse(JSON.stringify(this.data)));
    }
}