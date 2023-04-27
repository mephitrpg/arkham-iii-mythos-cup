class InvestigatorsTokens extends StoredObject {
    constructor() {
        super('investigators', [{mythosTokens:[], drawn:0}, {mythosTokens:[], drawn:0}, {mythosTokens:[], drawn:0}, {mythosTokens:[], drawn:0}, {mythosTokens:[], drawn:0}, {mythosTokens:[], drawn:0}], {
            toObject: investigators => {
                return investigators.map(investigator => {
                    // legacy code
                    if (Array.isArray(investigator)) {
                        return {
                            mythosTokens: investigator.map(data => new MythosToken(data)),
                            drawn: 0,
                        }
                    }
                    // new code
                    return {
                        ...investigator,
                        mythosTokens: investigator.mythosTokens.map(data => new MythosToken(data)),
                    };
                });
            },
            toJSON: investigators => {
                return investigators.map(investigator => ({
                    ...investigator,
                    mythosTokens: investigator.mythosTokens.map(token => token.data),
                })
            )},
        });
        return this;
    }

    quantity(tokenId) {
        return this.ref().reduce((result, investigator) => {
            return result + investigator.mythosTokens.reduce((investigatorResult, token) => {
                if (token.getId() === tokenId) return investigatorResult + 1;
                return investigatorResult;
            }, 0);
        }, 0);
    }

    getByInvestigator(investigatorIndex) {
        return this.ref()[investigatorIndex].mythosTokens;
    }

    drawn(investigatorIndex, quantity) {
        if (!Number.isFinite(quantity)) {
            return this.ref()[investigatorIndex].drawn;
        }
        this.ref()[investigatorIndex].drawn = quantity;
    }

    add(token, investigatorIndex) {
        // const currentInvestigatorIindex = this.ref().findIndex(investigator => investigator.some(token => token.isActual()));
        // const wasActualInvestigator = investigatorIndex === currentInvestigatorIindex;
        this.ref().forEach((investigator, i) => {
            investigator.mythosTokens.forEach(token => {
                if (token.isBeforeLatest()) {
                    token.isBeforeLatest(false);
                } else if (token.isLatest()) {
                    token.isLatest(false);
                    token.isBeforeLatest(true);
                }
            });
                if (i === investigatorIndex) {
                    this.drawn(i, this.drawn(i) + 1);
                } else {
                    this.drawn(i, 0);
                }
        });
        this.ref()[investigatorIndex].mythosTokens.push(token);
        this.write();
    }

    removeAt(tokenIndex, investigatorIndex) {
        const [token] = this.ref()[investigatorIndex].mythosTokens.splice(tokenIndex, 1);
        this.write();
        return token;
    }

}