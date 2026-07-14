import * as Hyper from "./hyper.js";
import * as Weyl from "./weyl.js";
type line = Hyper.vec3;
type point = Hyper.vec3;
type groupword = Weyl.groupword;

const canvas = document.getElementById("c") as HTMLCanvasElement;
const disk = new Hyper.PoincareDiskRenderer(canvas);
const ctx = disk.ctx;

export const style = {
    fill1: "white",
    fill2: "red",
    fill3: "blue",
    stroke1: "black",
    stroke2: "",
    width: 0.5
}

function intersect(a: line, b: line): point {
    let v = Hyper.cross(a, b);
    if (v.t < 0) {
        v.t = -v.t; v.x = -v.x; v.y = -v.y;
    }
    let n = Math.sqrt(Hyper.dot(v, v));
    v.t /= n; v.x /= n, v.y /= n;
    return v;
}
function bary(A: point, B: point, C: point, a: number, b: number, c: number): point {
    let v = {
        x: A.x*a+B.x*b+C.x*c,
        y: A.y*a+B.y*b+C.y*c,
        t: A.t*a+B.t*b+C.t*c
    };
    if (v.t < 0) {
        v.t = -v.t; v.x = -v.x; v.y = -v.y;
    }
    let n = Math.sqrt(Hyper.dot(v, v));
    v.t /= n; v.x /= n, v.y /= n;
    return v;
}

export const TriangleRenderer: {[show: string]: (a: line, b: line, c: line, word: groupword, G: Weyl.CoxeterGroup) => void} = {
    outline: function(a: line, b: line, c: line): void {
        let A = intersect(b, c), B = intersect(a, c), C = intersect(a, b);
        ctx.beginPath();
        disk.moveTo(A);
        disk.segment(c, A, B);
        disk.segment(a, B, C);
        disk.segment(b, C, A);
        ctx.lineWidth = style.width;
        ctx.strokeStyle = style.stroke2 || "black";
        ctx.stroke();
    },
    alternate: function(a: line, b: line, c: line, word: groupword): void {
        let A = intersect(b, c), B = intersect(a, c), C = intersect(a, b);
        ctx.beginPath();
        disk.moveTo(A);
        disk.segment(c, A, B);
        disk.segment(a, B, C);
        disk.segment(b, C, A);
        ctx.fillStyle = (word.length % 2) ? style.fill1 : style.fill2;
        ctx.fill();
        ctx.lineWidth = style.width;
        if (style.stroke2) {
            ctx.strokeStyle = style.stroke2;
            ctx.stroke();
        }
    },
    poly2: function(a: line, b: line, c: line): void {
        let A = intersect(b, c), B = intersect(a, c), C = intersect(a, b);
        let alt = Hyper.cross(B, b);
        let D = intersect(alt, b);
        ctx.beginPath();
        disk.moveTo(B);
        disk.segment(alt, B, D);
        disk.segment(b, D, C);
        disk.segment(a, C, B);
        ctx.fillStyle = style.fill1;
        ctx.fill();
        ctx.beginPath();
        disk.moveTo(B);
        disk.segment(alt, B, D);
        disk.segment(b, D, A);
        disk.segment(c, A, B);
        ctx.fillStyle = style.fill2;
        ctx.fill()
        ctx.lineWidth = style.width;
        if (style.stroke1) {
            ctx.beginPath();
            disk.moveTo(A);
            disk.segment(c, A, B);
            disk.segment(a, B, C);
            disk.segment(b, C, A);
            ctx.strokeStyle = style.stroke1;
            ctx.stroke();
        }
        if (style.stroke2) {
            ctx.beginPath();
            disk.moveTo(B);
            disk.segment(alt, B, D);
            ctx.strokeStyle = style.stroke2;
            ctx.stroke();
        }
    },
    poly3: function(a: line, b: line, c: line, _: groupword, G: Weyl.CoxeterGroup): void {
        let m = G.coxetermatrix;
        let A = intersect(b, c), B = intersect(a, c), C = intersect(a, b);
        let O = bary(A, B, C, Math.sin(Math.PI/m[1][2]), Math.sin(Math.PI/m[0][2]), Math.sin(Math.PI/m[0][1]));
        let la = Hyper.cross(a, O), lb = Hyper.cross(b, O), lc = Hyper.cross(c, O);
        let D = intersect(la, a), E = intersect(lb, b), F = intersect(lc, c);
        ctx.beginPath();
        disk.moveTo(O);
        disk.segment(la, O, D);
        disk.segment(a, D, B);
        disk.segment(c, B, F);
        disk.segment(lc, F, O);
        ctx.fillStyle = style.fill3;
        ctx.fill();
        ctx.beginPath();
        disk.moveTo(O);
        disk.segment(lb, O, E);
        disk.segment(b, E, C);
        disk.segment(a, C, D);
        disk.segment(la, D, O);
        ctx.fillStyle = style.fill1;
        ctx.fill();
        ctx.beginPath();
        disk.moveTo(O);
        disk.segment(lc, O, F);
        disk.segment(c, F, A);
        disk.segment(b, A, E);
        disk.segment(lb, E, O);
        ctx.fillStyle = style.fill2;
        ctx.fill();
        ctx.lineWidth = style.width;
        if (style.stroke1) {
            ctx.beginPath();
            disk.moveTo(A);
            disk.segment(c, A, B);
            disk.segment(a, B, C);
            disk.segment(b, C, A);
            ctx.strokeStyle = style.stroke1;
            ctx.stroke();
        }
        if (style.stroke2) {
            ctx.beginPath();
            disk.moveTo(O);
            disk.segment(la, O, D);
            disk.moveTo(O);
            disk.segment(lb, O, E);
            disk.moveTo(O);
            disk.segment(lc, O, F);
            ctx.strokeStyle = style.stroke2;
            ctx.stroke();
        }
    },
    polya: function(a: line, b: line, c: line, word: groupword): void {
        let A = intersect(b, c), B = intersect(a, c), C = intersect(a, b);
        ctx.beginPath();
        disk.moveTo(A);
        disk.segment(c, A, B);
        disk.segment(a, B, C);
        disk.segment(b, C, A);
        ctx.fillStyle = ([...word].reduce((n, c) => (n + (c == "c" ? 1 : 0)), 0) % 2) ? style.fill2 : style.fill1;
        ctx.fill();
        ctx.lineWidth = style.width;
        if (style.stroke1) {
            ctx.strokeStyle = style.stroke1;
            ctx.stroke();
        }
        if (style.stroke2) {
            ctx.beginPath();
            disk.moveTo(B);
            disk.segment(c, B, A);
            ctx.strokeStyle = style.stroke2;
            ctx.stroke()
        }
    },
    polyb: function(a: line, b: line, c: line, word: groupword): void {
        let A = intersect(b, c), B = intersect(a, c), C = intersect(a, b);
        ctx.beginPath();
        disk.moveTo(A);
        disk.segment(c, A, B);
        disk.segment(a, B, C);
        disk.segment(b, C, A);
        ctx.fillStyle = ([...word].reduce((n, c) => (n + (c == "a" ? 1 : 0)), 0) % 2) ? style.fill2 : style.fill1;
        ctx.fill();
        ctx.lineWidth = style.width;
        if (style.stroke1) {
            ctx.strokeStyle = style.stroke1;
            ctx.stroke();
        }
        if (style.stroke2) {
            ctx.beginPath();
            disk.moveTo(B);
            disk.segment(a, B, C);
            ctx.strokeStyle = style.stroke2;
            ctx.stroke()
        }
    },
}

export function clear() {
    disk.clear();
}
