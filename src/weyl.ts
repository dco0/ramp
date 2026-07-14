type rewriterule = [string, string];
type rewriterules = rewriterule[];
function rewrite(s: string, rules: rewriterules): string {
    let changed = true;
    while (changed) {
        changed = false;
        for (let rule of rules) {
            let pos = s.indexOf(rule[0]);
            if (pos != -1) {
                s = s.slice(0,pos)+rule[1]+s.slice(pos+rule[0].length);
                changed = true; break;
            }
        }
    }
    return s;
}
function get_overlaps(s: rewriterule, t: rewriterule): rewriterules {
    let pairs: rewriterules = []
    let pos = s[0].indexOf(t[0]);
    if (pos != -1) {
        pairs.push([s[1], s[0].slice(0,pos)+t[1]+s[0].slice(pos+t[0].length)]);
    }
    for (let n = 1; n < s[0].length && n < t[0].length; n++) {
        if (s[0].slice(s[0].length-n) == t[0].slice(0,n)) 
            pairs.push([s[0].slice(0,s[0].length-n)+t[1], s[1]+t[0].slice(n)]);
    }
    return pairs;
}
function reduce_rules(rules: rewriterules): void {
    for (let i = 0; i < rules.length; i++) {
        var red = false;
        for (let j = 0; j < rules.length; j++) {
            if (rules[i][0].includes(rules[j][0]) && (rules[i][0] != rules[j][0] || j < i)) {
                red = true; break;
            }
        }
        if (red) {
            rules.splice(i, 1); i--;
        }
        else {
            let s = rewrite(rules[i][1], rules);
            if (s != rules[i][1])
                rules[i][1] = rewrite(rules[i][1], rules);
        }
    }
}
function knuthbendix(eqns: rewriterules): rewriterules {
    let tasks: rewriterules = [];
    let rules: rewriterules = [];
    for (let x of eqns) tasks.push(x);

    while (tasks.length) {
        let [u,v] = tasks.shift() as [string, string];
        u = rewrite(u, rules);
        v = rewrite(v, rules);
        if (u == v) continue;
        if (u.length < v.length || u.length == v.length && u < v) {
            let t = u; u = v; v = t;
        }
        for (let rule of rules) {
            for (let cp of get_overlaps([u,v], rule))
                tasks.push(cp);
            for (let cp of get_overlaps(rule, [u,v]))
                tasks.push(cp);
        }
        rules.push([u,v]);
    }

    reduce_rules(rules);
    return rules;
}

export type matrix = number[][];
function coxeter_pres(mat: matrix): rewriterules {
    let rules: rewriterules = [];
    for (let i = 0; i < mat.length; i++) {
        let x = String.fromCharCode(97+i);
        rules.push([x+x,""]);
        for (let j = 0; j < i; j++) {
            let y = String.fromCharCode(97+j);
            if (mat[i][j] != Infinity)
                rules.push([(x+y).repeat(mat[i][j]),""]);
        }
    }
    return knuthbendix(rules);
}

export type groupword = string;
export class CoxeterGroup {
    readonly coxetermatrix: matrix;
    readonly rules: rewriterules;
    private forbid: string[];
    constructor(coxetermat: matrix) {
        for (let i = 0; i < coxetermat.length; i++) {
            if (coxetermat[i].length != coxetermat.length) {
                throw Error("Coxeter matrix must be square");
            }
            if (coxetermat[i][i] != 1) {
                throw Error("Diagonal entries must be 1");
            }
            for (let j = 0; j < i; j++) {
                if (coxetermat[i][j] != coxetermat[j][i]) {
                    throw Error("Coxeter matrix must be symmetric");
                }
                if ((!Number.isInteger(coxetermat[i][j]) || coxetermat[i][j] <= 1) && coxetermat[i][j] != Infinity) {
                    throw Error("Coxeter matrix entries must be integers >= 2 or infinity");
                }
            }
        }
        this.coxetermatrix = coxetermat;
        this.rules = coxeter_pres(coxetermat);
        this.forbid = this.rules.map((v) => v[0]);
    }
    get rank(): number {
        return this.coxetermatrix.length;
    }
    get generators(): string {
        let out = "";
        for (let i = 0; i < this.rank; i++)
            out += String.fromCharCode(97+i);
        return out;
    }
    reduce(word: groupword): groupword {
        return rewrite(word, this.rules);
    }
    reduced(word: groupword): boolean {
        for (let f of this.forbid) {
            if (word.includes(f)) return false;
        }
        return true;
    }
}
