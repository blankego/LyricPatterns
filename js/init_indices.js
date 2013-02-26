module.exports = (function () {
    var raw = require("./indices")
        , pLetter = /[A-Z]/g
        , pNumber = /\d+/g
        , authors = []
        , titles = []
        , aAcronyms = {}
        , tAcronyms = {}
        , charCounts = {}
        , categories = {P: [], Z: [], H: [], X: []}
        , res = {
            titles: titles, tAcronyms: [],
            cCounts: [], categories: categories,
            authors: authors, aAcronyms: []
        }
        , ent, i, k;

    function countChar(s, start, end) {
        var count = 0;
        for (start = start || 0, end = end || s.length - start; start < end; ++start, ++count) {
            if ((s.charCodeAt(start) & 0xfc00) == 0xd800)++start;
        }
        return count;
    }

    function splitAcronyms(s) {
        var idx = s.search(pLetter)
            , count = countChar(s, 0, idx)
            , res = [s.substr(0, idx)]
            , len = s.length;
        for (; idx < len; idx += count) {
            res.push(s.substr(idx, count));
        }
        return res;
    }

    for (i = 0; i < raw.indices.length; ++i) {
        ent = raw.indices[i];
        ent[0].split('|').map(splitAcronyms).forEach(function (arr) {
            //title acronyms as obj in place of a SET, should be converted to arr later
            for (var j = 1; j < arr.length; ++j) {
                (tAcronyms[arr[j]] || (tAcronyms[arr[j]] = {}))[titles.length] = true;
            }
	        //title
	        titles.push([arr[0], i]);
        });

        //counts
        ent[1].match(pNumber).forEach(function (cnt, sub) {
            (charCounts[cnt] || (charCounts[cnt] = [])).push(i * 1000 + sub);
        });

        //categories
        ent[1].match(pLetter).forEach(function (cat, sub) {
            categories[cat].push(i * 1000 + sub)
        });
    }

    for (i = 0; i < raw.authors.length; ++i) {
        ent = raw.authors[i];
        var first = splitAcronyms(ent[0]);
        first.slice(1).forEach(function (acronym) {
            (aAcronyms[acronym] || (aAcronyms[acronym] = {}))[authors.length] = true;
        });
	    authors.push([first[0]].concat(ent.slice(1)));
    }

    //obj to arr conversions
    for (k in tAcronyms) {
        res.tAcronyms.push([k].concat(Object.keys(tAcronyms[k])));
    }

    for (k in charCounts) {
        res.cCounts.push([parseInt(k,10), charCounts[k]]);
    }

    for (k in aAcronyms) {
        res.aAcronyms.push([k].concat(Object.keys(aAcronyms[k])));
    }

    return res;
})();


//if (require.main === module)!function () {
//    console.log(module.exports.cCounts);
//}();