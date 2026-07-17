/**
 * rendering code for hyperbolic tilings
 */

import * as Hyper from "./hyper.js";
import * as Weyl from "./weyl.js";
import { ctx, clear } from "./tile_style.js";
type line = Hyper.vec3;
type point = Hyper.vec3;
type groupword = Weyl.groupword;

function triangleSize(a: line, b: line, c: line): number {
    let A = Hyper.intersect(b, c), B = Hyper.intersect(a, c), C = Hyper.intersect(a, b);
    return Math.min(A.t, B.t, C.t);
}

// how far out to draw triangles
const sizelimit = 150;

/**
 * creates tiling (n, m, l)
 */
function redraw(n: number, m: number, l: number) {
    // check 1/n + 1/m + 1/l < 1 for hyperbolicity
    if (n*m+n*l+m*l>=n*m*l) {
        alert("no hyperbolic tiling with these parameters");
        return;
    }

    // find the starting triangle
    let l1: line = {x:0,y:1,t:0};
    let l2: line = {x:Math.sin(Math.PI/m),y:Math.cos(Math.PI/m),t:0};
    let l3: line = (function() {
        const y = Math.cos(Math.PI/l);
        const x = (Math.cos(Math.PI/n)-Math.cos(Math.PI/m)*Math.cos(Math.PI/l))/Math.sin(Math.PI/m);
        const t = Math.sqrt(x*x+y*y-1);
        return {x,y,t};
    })();
    if (isNaN(l3.t)) return;
    // build the symmetry group
    const G = new Weyl.CoxeterGroup([[1,m,l],[m,1,n],[l,n,1]]);

    let tilecount = 1;
    let starttime = performance.now();
    // we label a triangle by its three sides and the (unique) symmetry mapping the starting triangle to it
    type triangle = [[line, line, line], groupword];
    // starting triangle
    let orig: triangle = [[l1, l2, l3], ""];
    ctx.draw(orig);

    // DFS to explore all triangles within given distance
    let to_explore: triangle[] = [orig];
    while (to_explore.length) {
        let trg = to_explore.pop() as triangle;
        for (let g of "abc") {
            // explore the reflections of `trg` across the three sides, unless that would lead to a duplicate
            if (!G.reduced(trg[1] + g)) continue;
            let newtrg: triangle = [[...trg[0]], trg[1] + g];
            let f = g.charCodeAt(0) - 97;
            for (let i = 0; i < 3; i++) {
                if (i != f)
                    newtrg[0][i] = Hyper.reflect(newtrg[0][i], newtrg[0][f]);
            }
            if (triangleSize(...newtrg[0]) > sizelimit) continue;
            ctx.draw(newtrg);
            to_explore.push(newtrg);
            tilecount++;
        }
    }

    let endtime = performance.now();
    console.log("rendered " + tilecount + " tiles in " + (endtime - starttime).toFixed(3) + "ms");
}

// DEAL WITH USER INPUTS

const inputs = {
    n: document.getElementById("n") as HTMLInputElement,
    m: document.getElementById("m") as HTMLInputElement,
    
    coloring: document.getElementById("coloring") as HTMLSelectElement,
    pattern: document.getElementById("pattern") as HTMLSelectElement,
    
    width: document.getElementById("width") as HTMLInputElement,
    stroke: document.getElementById("stroke") as HTMLInputElement,
    background: document.getElementById("background") as HTMLInputElement,
    border: document.getElementById("border") as HTMLInputElement
}
class SwatchManager {
    private container: HTMLElement;
    private swatches: HTMLElement;
    constructor(container: HTMLElement) {
        this.container = container;
        this.swatches = container.querySelector("div") as HTMLElement;
        let addBtn = container.querySelector("button") as HTMLElement;
        addBtn.addEventListener("click", () => this.create("white"));
    }

    create(color: string) {
        const row = document.createElement("div");
        row.className = "swatch";
        row.draggable = true;
        const handle = document.createElement("div");
        handle.className = "handle";
        handle.textContent = "☰";
        const colorInput = document.createElement("input");
        colorInput.type = "color";
        colorInput.value = color;
        const delBtn = document.createElement("button");
        delBtn.textContent = "✕";
        delBtn.addEventListener("click", () => { row.remove(); });

        row.append(handle, colorInput, delBtn);
        row.addEventListener("dragstart", () => { row.classList.add("dragging"); });
        row.addEventListener("dragend", () => { row.classList.remove("dragging"); });
        
        this.swatches.appendChild(row);
        
        this.swatches.addEventListener("dragover", e => {
            e.preventDefault();
            const dragging = this.swatches.querySelector(".dragging") as HTMLElement;
            const after = this.dragpos(e.clientY);
            if (after == null)
                this.swatches.appendChild(dragging);
            else
                this.swatches.insertBefore(dragging, after);
        });
    }

    private dragpos(y: number) {
        const rows = [...this.swatches.querySelectorAll(".swatch:not(.dragging)")];
        return rows.find(row => {
            const rect = row.getBoundingClientRect();
            return y < rect.top+rect.height/2;
        });
    }

    get palette(): string[] {
        return [...this.swatches.querySelectorAll("input[type=color]")]
               .map(i => (i as HTMLInputElement).value);
    }
}
const swatches = new SwatchManager(document.getElementById("swatches") as HTMLElement);

function updateStyles() {
    let n = parseInt(inputs.n.value);
    let m = parseInt(inputs.m.value);
    let l = 2; 
    let p = inputs.pattern.value;

    let allowed: [string, string][] = [];
    allowed.push(["Outline", "none"]);
    if (p == "poly2")
        allowed.push(["Fill", "const2"]);
    if (p == "poly3")
        allowed.push(["Fill", "const3"]);
    if (p == "plain")
        allowed.push(["Alternate", "abel_abc"]);
    if (n % 2 == 0 && p == "polya")
        allowed.push(["Alternate", "abel_c"]);
    if (m % 2 == 0 && p == "polyb")
        allowed.push(["Alternate", "abel_a"]);
    if (m % 2 == 0 && p == "polya")
        for (let i = 3; i <= n; i++)
            if (n % i == 0)
                allowed.push(["D"+i, "dih_a_b_"+i]);
    if (n % 2 == 0 && p == "polyb")
        for (let i = 3; i <= m; i++)
            if (m % i == 0)
                allowed.push(["D"+i, "dih_c_b_"+i]);
    
    while (inputs.coloring.firstChild)
        inputs.coloring.removeChild(inputs.coloring.lastChild as ChildNode);
    for (let [name, coloring] of allowed) {
        let e = document.createElement("option");
        e.setAttribute("value", coloring);
        e.innerText = name;
        inputs.coloring.appendChild(e);
    }
}

inputs.n.addEventListener("input", updateStyles);
inputs.m.addEventListener("input", updateStyles);
inputs.pattern.addEventListener("input", updateStyles);

document.getElementById("renderBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    let n = parseInt(inputs.n.value);
    let m = parseInt(inputs.m.value);
    let l = 2;

    const G = new Weyl.CoxeterGroup([[1,m,l],[m,1,n],[l,n,1]]);
    let stroke = inputs.coloring.value == "none";
    ctx.coloring = [inputs.coloring.value, G];
    if (stroke) {
        ctx.lines = [parseFloat(inputs.width.value), inputs.stroke.value];
    }
    else {
        ctx.lines = false;
    }

    let palette = swatches.palette;
    if (palette.length < ctx.colors_needed) {
        alert("" + ctx.colors_needed + " colors needed");
        return;
    }
    else {
        ctx.colors = palette;
    }

    clear();
    ctx.disk(1, inputs.border.value);
    ctx.disk(1-1/sizelimit, inputs.background.value);
    ctx.style = inputs.pattern.value;
    redraw(n,m,l);
});

document.getElementById("saveBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    saveImg(document.getElementById("disk") as HTMLCanvasElement, "tiling.png");
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

["red", "white"].forEach(swatches.create.bind(swatches));
updateStyles();
document.getElementById("renderBtn")?.click();
