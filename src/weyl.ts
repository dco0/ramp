/**
 * a library for some geometric group theory computations
 * contents:
 *  - Knuth-Bendix completion algorithm
 *  - `AutoGroup`: general representation of a nice group
 *  - `CoxeterGroup`: specialization of `AutoGroup` for Coxeter groups
 */

/**
 * represents a rewriting rule a -> b
 */
type rewriterule = [string, string];
/**
 * represents a collection of rewriting rules
 */
export type rewriterules = rewriterule[];
/**
 * reduces a string through a set of rewriting rules, assuming strong normalization
 * @param s string to reduce
 * @param rules rewriting rules
 * @return reduced form of `s`
 */
export function rewrite(s: string, rules: rewriterules): string {
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
function getOverlaps(s: rewriterule, t: rewriterule): rewriterules {
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
function reduceRules(rules: rewriterules): void {
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
/**
 * given an initial set of rewriting rules, attempt to complete it into a confluent system
 * WARNING: on a random input, this may not terminate (otherwise the word problem would be decidable)
 * @param eqns initial rewriting rules
 * @returns Knuth-Bendix completion of `eqns`
 */
function knuthBendix(eqns: rewriterules): rewriterules {
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
            for (let cp of getOverlaps([u,v], rule))
                tasks.push(cp);
            for (let cp of getOverlaps(rule, [u,v]))
                tasks.push(cp);
        }
        rules.push([u,v]);
    }

    reduceRules(rules);
    return rules;
}

/**
 * represents a matrix
 */
export type matrix = number[][];
/**
 * converts a Coxeter matrix into a group presentation
 * @param mat Coxeter matrix
 * @returns the generators and a presentation for the Coxeter group
 */
function coxeterPresentation(mat: matrix): [string, rewriterules] {
    let rules: rewriterules = [];
    let gens: string = "";
    for (let i = 0; i < mat.length; i++) {
        let x = String.fromCharCode(97+i);
        rules.push([x+x,""]);
        gens += x;
        for (let j = 0; j < i; j++) {
            let y = String.fromCharCode(97+j);
            if (mat[i][j] != Infinity)
                rules.push([(x+y).repeat(mat[i][j]),""]);
        }
    }
    return [gens, rules];
}

/**
 * represents group elements in terms of generators
 */
export type groupword = string;
/**
 * represents an automatic group; roughly a group that can be described in terms of a presentation with strongly normalizing rewrites
 */
export class AutoGroup {
    /**
     * the rewriting system of the group
     */
    readonly rules: rewriterules;
    /**
     * the subwords that are forbidden in a reduced form
     */
    protected readonly forbid: string[];
    /**
     * the generators of the group
     */
    readonly generators: string;
    /**
     * @param generators generators of the group
     * @param presentation a presentation; not necessarily strong normalizing
     */
    constructor(generators: string, presentation: rewriterules) {
        this.generators = generators;
        this.rules = knuthBendix(presentation);
        this.forbid = this.rules.map((v) => v[0]);
    }
    /**
     * given a word in terms of generators, reduce it to simplest form
     * @param word a word in the group
     * @returns simplest form of `word`
     */
    reduce(word: groupword): groupword {
        return rewrite(word, this.rules);
    }
    /**
     * given a word in terms of generators, check if it is in simplest form
     * @param word a word in the group
     * @returns if `word` is in simplest form
     */
    reduced(word: groupword): boolean {
        for (let f of this.forbid) {
            if (word.includes(f)) return false;
        }
        return true;
    }
}
/**
 * represents a Coxeter group, a group that can be presented with a Coxeter-style presentation
 */
export class CoxeterGroup extends AutoGroup {
    /**
     * the Coxeter matrix; this determines the group
     */
    readonly coxeterMatrix: matrix;
    /**
     * @param coxetermat the Coxeter matrix
     */
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
        super(...coxeterPresentation(coxetermat))
        this.coxeterMatrix = coxetermat;
    }
    /**
     * the rank of the Coxeter group, which is the number of defining generators
     */
    get rank(): number {
        return this.coxeterMatrix.length;
    }
}
