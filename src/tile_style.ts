/**
 * implements different styles for tilings
 * all tilings are created from a grid of triangles; different types are created by drawing the triangles differently
 */
import * as Hyper from "./hyper.js";
import * as Weyl from "./weyl.js";
type line = Hyper.vec3;
type point = Hyper.vec3;
type groupword = Weyl.groupword;

const canvas = document.getElementById("disk") as HTMLCanvasElement;
const _ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
const disk = new Hyper.PoincareDiskRenderer(_ctx);
disk.width = canvas.width;
disk.height = canvas.height;

type ColoringScheme = [number, (word: groupword) => number];
class TriangleRenderingContext {
    private readonly ctx: CanvasRenderingContext2D;
    private fillpalette: string[] = [];
    private colorings: [RegExp, (scheme: string, G: Weyl.CoxeterGroup) => ColoringScheme][] = [];
    private styles: {[name: string]: (a: line, b: line, c: line, s: number) => void} = {};
    private currentstroke: [boolean, number, string] = [false, 0, ""];

    G?: Weyl.CoxeterGroup;
    private color: ColoringScheme = [0, () => -1];
    private pattern: (a: line, b: line, c: line, s: number) => void = () => {};

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }
    begin() {
        this.ctx.beginPath();
    }
    fill(color: number) {
        if (color != -1)  {
            this.ctx.fillStyle = this.fillpalette[color];
            this.ctx.fill();
        }
    }
    stroke() {
        if (this.currentstroke[0]) {
            this.ctx.lineWidth = this.currentstroke[1];
            this.ctx.strokeStyle = this.currentstroke[2];
            this.ctx.stroke();
        }
    }
    registerColoring(pattern: RegExp, rule: (scheme: string, G: Weyl.CoxeterGroup) => ColoringScheme) {
        this.colorings.push([pattern, rule]);
    }
    set coloring([scheme, G]: [string, Weyl.CoxeterGroup]) {
        this.G = G;
        for (let [pattern, rule] of this.colorings) {
            if (pattern.test(scheme))
                this.color = rule(scheme, G);
        }
    }
    set style(style: string) {
        this.pattern = this.styles[style];
    }
    set lines(lines: boolean | [number, string]) {
        if (typeof lines === "boolean") {
            this.currentstroke[0] = lines;
        }
        else {
            this.currentstroke = [true, ...lines];
        }
    }
    get colors_needed(): number {
        return this.color[0];
    }
    set colors(colors: string[]) {
        this.fillpalette = colors;
    }
    registerStyle(name: string, draw: (a: line, b: line, c: line, s: number) => void) {
        this.styles[name] = draw;
    }
    draw(trg: [[line, line, line], groupword]) {
        this.pattern(...trg[0], this.color[1](trg[1]));
    }
    disk(fill: string, stroke?: string) {
        this.begin();
        disk.disk(1);
        if (stroke != undefined) {
            this.ctx.fillStyle = stroke;
            this.ctx.fill();
            this.begin();
            disk.disk(0.995);
        }
        this.ctx.fillStyle = fill;
        this.ctx.fill();
    }
}
export const ctx = new TriangleRenderingContext(_ctx);

ctx.registerColoring(/abel_a?b?c?/, (scheme, G) => {
    let t = scheme.slice(5);
    return [2, (word) => [...word].reduce((n,c) => (n+(t.includes(c)?1:0)),0)%2];
});
ctx.registerColoring(/dih_[abc]_[abc](_\d+)?/, (scheme, G) => {
    let mat = G.coxeterMatrix;
    let u = scheme[4];
    let v = scheme[6];
    let n = parseInt(scheme.slice(8)) || (u=="a"?mat[1][2]:u=="b"?mat[0][2]:mat[0][1]);
    let rules: Weyl.rewriterules = [[u,""], ["aa",""], ["bb",""], ["cc",""]];
    return [n, (word) => {
        word = Weyl.rewrite(word, rules);
        let a = word.length%2;
        let b = word.endsWith(v)?(1-2*a):(2*a-1);
        return (n+(a+b*word.length)/2%n)%n;
    }];
});
ctx.registerColoring(/none/, (scheme, G) => {
    return [0, () => -1];
});
ctx.registerColoring(/plain/, (scheme, G) => {
    return [1, () => 0];
});
ctx.registerColoring(/const\d+/, (scheme, G) => {
    let n = parseInt(scheme.slice(5));
    return [n, () => 0];
})
ctx.registerStyle("plain", (a, b, c, s) => {
    let A = Hyper.intersect(b, c), B = Hyper.intersect(a, c), C = Hyper.intersect(a, b);
    ctx.begin();
    disk.moveTo(A);
    disk.segment(c, A, B);
    disk.segment(a, B, C);
    disk.segment(b, C, A);
    ctx.fill(s);
    ctx.stroke();
});
ctx.registerStyle("polya", (a, b, c, s) => {
    let A = Hyper.intersect(b, c), B = Hyper.intersect(a, c), C = Hyper.intersect(a, b);
    ctx.begin();
    disk.moveTo(A);
    disk.segment(c, A, B);
    ctx.stroke();
    disk.segment(a, B, C);
    disk.segment(b, C, A);
    ctx.fill(s);
});
ctx.registerStyle("polyb", (a, b, c, s) => {
    let A = Hyper.intersect(b, c), B = Hyper.intersect(a, c), C = Hyper.intersect(a, b);
    ctx.begin();
    disk.moveTo(B);
    disk.segment(a, B, C);
    ctx.stroke();
    disk.segment(b, C, A);
    disk.segment(c, A, B);
    ctx.fill(s);
});
ctx.registerStyle("poly2", (a, b, c, s) => {
    let A = Hyper.intersect(b, c), B = Hyper.intersect(a, c), C = Hyper.intersect(a, b);
    let alt = Hyper.cross(B, b);
    let D = Hyper.intersect(alt, b);
    if (s != -1) {
        ctx.begin();
        disk.moveTo(B);
        disk.segment(alt, B, D);
        disk.segment(b, D, C);
        disk.segment(a, C, B);
        ctx.fill(0);
        ctx.begin();
        disk.moveTo(B);
        disk.segment(alt, B, D);
        disk.segment(b, D, A);
        disk.segment(c, A, B);
        ctx.fill(1);
    }
    ctx.begin();
    disk.moveTo(B);
    disk.segment(alt, B, D);
    ctx.stroke();
});
ctx.registerStyle("poly3", (a, b, c, s) => {
    let m = (ctx.G as Weyl.CoxeterGroup).coxeterMatrix;
    let A = Hyper.intersect(b, c), B = Hyper.intersect(a, c), C = Hyper.intersect(a, b);
    let O = Hyper.bary(A, B, C, Math.sin(Math.PI/m[1][2]), Math.sin(Math.PI/m[0][2]), Math.sin(Math.PI/m[0][1]));
    let la = Hyper.cross(a, O), lb = Hyper.cross(b, O), lc = Hyper.cross(c, O);
    let D = Hyper.intersect(la, a), E = Hyper.intersect(lb, b), F = Hyper.intersect(lc, c);
    if (s != -1) {
        ctx.begin();
        disk.moveTo(O);
        disk.segment(la, O, D);
        disk.segment(a, D, B);
        disk.segment(c, B, F);
        disk.segment(lc, F, O);
        ctx.fill(2);
        ctx.begin();
        disk.moveTo(O);
        disk.segment(lb, O, E);
        disk.segment(b, E, C);
        disk.segment(a, C, D);
        disk.segment(la, D, O);
        ctx.fill(0);
        ctx.begin();
        disk.moveTo(O);
        disk.segment(lc, O, F);
        disk.segment(c, F, A);
        disk.segment(b, A, E);
        disk.segment(lb, E, O);
        ctx.fill(1);
    }
    ctx.begin();
    disk.moveTo(O);
    disk.segment(la, O, D);
    disk.moveTo(O);
    disk.segment(lb, O, E);
    disk.moveTo(O);
    disk.segment(lc, O, F);
    ctx.stroke();
})

export function clear() {
    disk.clear();
}
