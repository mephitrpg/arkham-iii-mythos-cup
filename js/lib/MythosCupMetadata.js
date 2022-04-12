class MythosCupMetadata extends StoredObject {
    constructor() {
        super('metadata', []);
        return this;
    }

    get(tokenId) {
        return this.ref().find(token => token.id === tokenId);
    }

    quantity(tokenId) {
        const token = this.get(tokenId);
        return token ? token.quantity : 0;
    }

    increment(tokenId) {
        const token = this.get(tokenId);
        if (token) {
            token.quantity++;
            this.write();
        }
    }

    decrement(tokenId) {
        const token = this.get(tokenId);
        if (token && token.quantity) {
            token.quantity--;
            this.write();
        }
    }

}