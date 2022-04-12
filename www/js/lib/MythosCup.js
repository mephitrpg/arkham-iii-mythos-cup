class MythosCup extends StoredObject {
    constructor() {
        super('mythosCup', [], {
            toObject: mythosCup => {
                return mythosCup.map(data => new MythosToken(data));
            },
            toJSON: mythosCup => {
                return mythosCup.map(token => token.data);
            },
        });
        return this;
    }

    // https://github.com/joepie91/node-random-number-csprng#readme
    rand(min, max) {
        var i = 0, rval = 0, bits = 0, bytes = 0;
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

    quantity(tokenId) {
        if (!tokenId) {
            return this.ref().length;
        }
        return this.ref().reduce((result, token) => {
            if (token.getId() === tokenId) return result + 1;
        }, 0);
    }

    add(token) {
        this.ref().push(token);
        this.write();
    }

    draw() {
        const index = this.rand(0, this.ref().length - 1);
        const token = this.removeAt(index);
        this.write();
        return token;
    }

    findIndex(tokenId) {
        return this.ref().findIndex(token => token.getId() === tokenId);
    }

    removeAt(index) {
        const [token] = this.ref().splice(index, 1);
        this.write();
        return token;
    }

}