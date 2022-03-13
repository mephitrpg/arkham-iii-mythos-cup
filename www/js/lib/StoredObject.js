class StoredObject {
    constructor (name, initialJSONValue, options) {
        this.name = name;
        this.initialJSONValue = initialJSONValue;
        this.options = _.defaults(options, {
            toObject: x => x, // READ: convert a JSON object to an object
            toJSON: obj => obj, // WRITE: convert an object to a JSON object
        });
        if (!localStorage.getItem(name)) {
           this.reset();
        } else {
            this.read();
        }
        return this;
    }
    reset(JSONvalue) {
        if (JSONvalue === undefined || JSONvalue === null) {
            JSONvalue = JSON.parse(JSON.stringify(this.initialJSONValue));
        }
        this.set(this.options.toObject(JSONvalue));
        this.write();
    }
    ref() {
        return this.obj;
    }
    set(obj) {
        this.obj = obj;
    }
    read () {
        const str = localStorage.getItem(this.name);
        let data;
        try { data = JSON.parse(str); } catch (e) {}
        this.obj = this.options.toObject(data);
        return this.obj;
    }
    write () {
        const data = this.options.toJSON(this.obj);
        localStorage.setItem(this.name, JSON.stringify(data));
    }
}