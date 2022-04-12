class InvestigatorsTokens extends StoredObject {
    constructor() {
        super('investigators', [[],[],[],[],[],[]], {
            toObject: investigators => {
                return investigators.map(investigator => investigator.map(data => new MythosToken(data)));
            },
            toJSON: investigators => {
                return investigators.map(investigator => investigator.map(token => token.data));
            },
        });
        return this;
    }

    quantity(tokenId) {
        return this.ref().reduce((result, investigator) => {
            return result + investigator.reduce((investigatorResult, token) => {
                if (token.getId() === tokenId) return investigatorResult + 1;
                return investigatorResult;
            }, 0);
        }, 0);
    }

    add(token, investigatorIndex) {
        this.ref().forEach(investigator => investigator.forEach(token => {
            if (token.isBeforeLatest()) {
                token.isBeforeLatest(false);
            } else if (token.isLatest()) {
                token.isLatest(false);
                token.isBeforeLatest(true);
            }
        }));
        this.ref()[investigatorIndex].push(token);
        this.write();
    }

    removeAt(tokenIndex, investigatorIndex) {
        const [token] = this.ref()[investigatorIndex].splice(tokenIndex, 1);
        this.write();
        return token;
    }

}