import {IBloomFilter} from "./i-bloom-filter";


export class BloomFilter implements IBloomFilter {

    m: number;
    k: number;

    typedArrays = typeof ArrayBuffer !== "undefined";

    buckets: Int32Array;

    _locations: any;

    constructor(m: number, k: number) {


        let a;
        if (typeof m !== "number") a = m;
        let m = a.length * 32;

        let n = Math.ceil(m / 32);
        let i = -1;

        this.m = m = n * 32;
        this.k = k;

        // if (this.typedArrays) {

            let kbytes = 1 << Math.ceil(Math.log(Math.ceil(Math.log(m) / Math.LN2 / 8)) / Math.LN2);
            let array = kbytes === 1 ? Uint8Array : kbytes === 2 ? Uint16Array : Uint32Array;
            let kbuffer = new ArrayBuffer(kbytes * k);
            let buckets = this.buckets = new Int32Array(n);

            if (a) while (++i < n) buckets[i] = a[i];
            this._locations = new array(kbuffer);

        // } else {
        //     let buckets = this.buckets = [];
        //     if (a) while (++i < n) buckets[i] = a[i];
        //     else while (++i < n) buckets[i] = 0;
        //     this._locations = [];
        // }

    }


    locations(v) {
        let k = this.k,
            m = this.m,
            r = this._locations,
            a = fnv_1a(v),
            b = fnv_1a_b(a),
            x = a % m;
        for (let i = 0; i < k; ++i) {
            r[i] = x < 0 ? (x + m) : x;
            x = (x + b) % m;
        }
        return r;
    };

    add(v) {
        let l = this.locations(v + ""),
            k = this.k,
            buckets = this.buckets;
        for (let i = 0; i < k; ++i) buckets[Math.floor(l[i] / 32)] |= 1 << (l[i] % 32);
    };

    test(v) {
        var l = this.locations(v + ""),
            k = this.k,
            buckets = this.buckets;
        for (let i = 0; i < k; ++i) {
            let b = l[i];
            if ((buckets[Math.floor(b / 32)] & (1 << (b % 32))) === 0) {
                return false;
            }
        }
        return true;
    }

    size() {
        let buckets = this.buckets,
            bits = 0;
        for (let i = 0, n = buckets.length; i < n; ++i) bits += popcnt(buckets[i]);
        return -this.m * Math.log(1 - bits / this.m) / this.k;
    }


}


function popcnt(v) {
    v -= (v >> 1) & 0x55555555;
    v = (v & 0x33333333) + ((v >> 2) & 0x33333333);
    return ((v + (v >> 4) & 0xf0f0f0f) * 0x1010101) >> 24;
}

// Fowler/Noll/Vo hashing.
function fnv_1a(v) {
    var a = 2166136261;
    for (var i = 0, n = v.length; i < n; ++i) {
        var c = v.charCodeAt(i),
            d = c & 0xff00;
        if (d) a = fnv_multiply(a ^ d >> 8);
        a = fnv_multiply(a ^ c & 0xff);
    }
    return fnv_mix(a);
}

// a * 16777619 mod 2**32
function fnv_multiply(a) {
    return a + (a << 1) + (a << 4) + (a << 7) + (a << 8) + (a << 24);
}

// One additional iteration of FNV, given a hash.
function fnv_1a_b(a) {
    return fnv_mix(fnv_multiply(a));
}

// See https://web.archive.org/web/20131019013225/http://home.comcast.net/~bretm/hash/6.html
function fnv_mix(a) {
    a += a << 13;
    a ^= a >>> 7;
    a += a << 3;
    a ^= a >>> 17;
    a += a << 5;
    return a & 0xffffffff;
}