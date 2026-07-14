import * as Hyper from "./hyper.js";
import * as Weyl from "./weyl.js";
import { TriangleRenderer, clear, style } from "./tile_style.js";
type line = Hyper.vec3;
type point = Hyper.vec3;
type groupword = Weyl.groupword;

function intersect(a: line, b: line): point {
    let v = Hyper.cross(a, b);
    if (v.t < 0) {
        v.t = -v.t; v.x = -v.x; v.y = -v.y;
    }
    let n = Math.sqrt(Hyper.dot(v, v));
    v.t /= n; v.x /= n, v.y /= n;
    return v;
}
function triangleSize(a: line, b: line, c: line): number {
    let A = intersect(b, c), B = intersect(a, c), C = intersect(a, b);
    return Math.min(A.t, B.t, C.t);
}

function drawTriangle(a: line, b: line, c: line, word: groupword, show: string, G: Weyl.CoxeterGroup): void {
    TriangleRenderer[show](a, b, c, word, G);
}

function redraw(n: number, m: number, l: number, show: string) {
    // 1/n + 1/m + 1/l < 1
    if (n*m+n*l+m*l>=n*m*l) {
        alert("no hyperbolic tiling with these parameters");
        return;
    }
    if (m % 2 && show == "polyb") {
        alert("PolyB requires m even");
        return;
    }
    if (n % 2 && show == "polya") {
        alert("PolyA requires n even");
    }

    const sizelimit = 150;
    let l1: line = {x:0,y:1,t:0};
    let l2: line = {x:Math.sin(Math.PI/m),y:Math.cos(Math.PI/m),t:0};
    let l3: line = (function() {
        const y = Math.cos(Math.PI/l);
        const x = (Math.cos(Math.PI/n)-Math.cos(Math.PI/m)*Math.cos(Math.PI/l))/Math.sin(Math.PI/m);
        const t = Math.sqrt(x*x+y*y-1);
        return {x,y,t};
    })();
    if (isNaN(l3.t)) return;
    const G = new Weyl.CoxeterGroup([[1,m,l],[m,1,n],[l,n,1]]);

    clear();

    type triangle = [[line, line, line], groupword];
    let orig: triangle = [[l1, l2, l3], ""];
    drawTriangle(...orig[0], orig[1], show, G);

    let to_explore: triangle[] = [orig];
    while (to_explore.length) {
        let trg = to_explore.pop() as triangle;
        for (let g of "abc") {
            if (!G.reduced(trg[1] + "g")) continue;
            let newtrg: triangle = [[...trg[0]], trg[1] + g];
            let f = g.charCodeAt(0) - 97;
            for (let i = 0; i < 3; i++) {
                if (i != f)
                    newtrg[0][i] = Hyper.reflect(newtrg[0][i], newtrg[0][f]);
            }
            if (triangleSize(...newtrg[0]) > sizelimit) continue;
            drawTriangle(...newtrg[0], newtrg[1], show, G);
            to_explore.push(newtrg);
        }
    }
}

const inputs = {
    n: document.getElementById("n") as HTMLInputElement,
    m: document.getElementById("m") as HTMLInputElement,
    t: document.getElementById("t") as HTMLInputElement,
    f1: document.getElementById("f1") as HTMLInputElement,
    f2: document.getElementById("f2") as HTMLInputElement,
    f3: document.getElementById("f3") as HTMLInputElement,
    s1c: document.getElementById("s1c") as HTMLInputElement,
    s1: document.getElementById("s1") as HTMLInputElement,
    s2c: document.getElementById("s2c") as HTMLInputElement,
    s2: document.getElementById("s2") as HTMLInputElement,
    w: document.getElementById("w") as HTMLInputElement
}

document.getElementById("r")?.addEventListener("click", (e) => {
    e.preventDefault();
    let n = parseInt(inputs.n.value);
    let m = parseInt(inputs.m.value);
    let l = 2;
    let show = inputs.t.value;

    style.fill1 = inputs.f1.value;
    style.fill2 = inputs.f2.value;
    style.fill3 = inputs.f3.value;
    style.stroke1 = inputs.s1c.checked ? inputs.s1.value : "";
    style.stroke2 = inputs.s2c.checked ? inputs.s2.value : "";
    style.width = parseFloat(inputs.w.value);

    redraw(n,m,l,show);
});

document.getElementById("s")?.addEventListener("click", (e) => {
    e.preventDefault();
    saveImg(document.getElementById("c") as HTMLCanvasElement, "tiling.png");
});

function saveImg(canvas: HTMLCanvasElement, filename: string): void {
    canvas.toBlob((blob: Blob | null) => {
        if (!blob) {
            console.error("Error downloading image");
            return;
        }
        try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error downloading image");
        }
    }, "image/png");
}

redraw(4,6,2,"outline");
