import {BloomFilter} from "../src/bloom-filter";


describe("test", () => {

    let x = new BloomFilter(1000, 4);

    x.add("karim");


    // expect(x.test("karim",true));

    console.log(x.test("karim"));

});