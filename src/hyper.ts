/**
 * a library for hyperbolic geometry computations
 * this is based on the hyperboloid model
 */

/**
 * geometric objects are represented by vectors in 2+1 Lorentzian space
 */
export type vec3 = {x: number, y: number, t: number};
/**
 * the Lorentzian dot product
 * @param u vector
 * @param v vector
 * @return `u` dot `v`
 */
export function dot(u: vec3, v: vec3): number {
    return u.t*v.t-u.x*v.x-u.y*v.y;
}
/**
 * the Lorentzian cross product
 * @param u vector
 * @param v vector
 * @return `u` cross `v`
 */
export function cross(u: vec3, v: vec3): vec3 {
    return {x: u.y*v.t-u.t*v.y, y: u.t*v.x-u.x*v.t, t: u.y*v.x-u.x*v.y};
}
/**
 * a Weyl reflection in Lorentzian space
 * @param p vector
 * @param l vector
 * @return the reflection of `p` across the plane perpendicular to `l`
 */
export function reflect(p: vec3, l: vec3): vec3 {
    const s = 2*dot(p,l)/dot(l,l);
    return {x: p.x-s*l.x, y: p.y-s*l.y, t: p.t-s*l.t};
}
/**
 * intersection of two lines
 * @param a line
 * @param b line
 * @return normalized intersection point
 */
export function intersect(a: vec3, b: vec3): vec3 {
    let v = cross(a, b);
    if (v.t < 0) {
        v.t = -v.t; v.x = -v.x; v.y = -v.y;
    }
    let n = Math.sqrt(dot(v, v));
    v.t /= n; v.x /= n, v.y /= n;
    return v;
}
/**
 * implements a form of barycentric coordinates
 * @param A point
 * @param B point
 * @param C point
 * @param a coordinate
 * @param b coordinate
 * @param c coordinate
 * @return point with barycentrics [`a`:`b`:`c`] in triangle ABC
 */
export function bary(A: vec3, B: vec3, C: vec3, a: number, b: number, c: number): vec3 {
    let v = {
        x: A.x*a+B.x*b+C.x*c,
        y: A.y*a+B.y*b+C.y*c,
        t: A.t*a+B.t*b+C.t*c
    };
    if (v.t < 0) {
        v.t = -v.t; v.x = -v.x; v.y = -v.y;
    }
    let n = Math.sqrt(dot(v, v));
    v.t /= n; v.x /= n, v.y /= n;
    return v;
}

/**
 * useful formulas:
 * point x on line y = dot(x, y) == 0
 * line through x and y = cross(x, y)
 * intersection of x and y = intersect(x, y)
 * line through x perpendicular to y = cross(x, y)
 * reflection of x (anything) across line y = reflect(x, y)
 * incenter of triangle ABC = bary(A, B, C, sin(A), sin(B), sin(C))
 */

/**
 * renderer for objects in the Poincare disk model
 * implements conversion from hyperboloid to disk
 */
export class PoincareDiskRenderer {
    readonly ctx: CanvasRenderingContext2D;
    private _width: number = 0;
    private _height: number = 0;
    private s: number = 0;
    private cx: number = 0;
    private cy: number = 0;
    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }
    set width(width: number) {
        this._width = width;
        this.s = Math.min(this._width,this._height)/2-5;
        this.cx = width/2;
    }
    set height(height: number) {
        this._height = height;
        this.s = Math.min(this._width,this._height)/2-5;
        this.cy = height/2;
    }
    clear(): void {
        this.ctx.clearRect(0, 0, this._width, this._height);
    }
    disk(r: number=1): void {
        this.ctx.arc(this.cx, this.cy, r*this.s, 0, 2*Math.PI);
    }
    drawLine(l: vec3): void {
        const u = Math.sqrt(-dot(l,l));
        const r = u/Math.abs(l.t);
        this.ctx.beginPath();
        if (r < 100) {
            const p = Math.atan2(-l.y*l.t,-l.x*l.t);
            const q = Math.atan(1/r);
            this.ctx.arc(this.cx+this.s*l.x/l.t, this.cy+this.s*l.y/l.t, this.s*r, p-q, p+q);
        }
        else {
            const v = Math.hypot(l.x,l.y);
            this.ctx.moveTo(this.cx+this.s*-l.y/v, this.cy+this.s*l.x/v);
            this.ctx.lineTo(this.cx+this.s*l.y/v, this.cy+this.s*-l.x/v);
        }
        this.ctx.stroke();
    }
    drawSegment(l: vec3, a: vec3, b: vec3): void {
        this.ctx.beginPath();
        this.segment(l, a, b);
        this.ctx.stroke();
    }
    segment(l: vec3, a: vec3, b: vec3): void {
        const u = Math.sqrt(-dot(l,l));
        const r = u/Math.abs(l.t);
        if (r < 100) {
            let p = Math.atan2(a.y/(1+a.t)-l.y/l.t,a.x/(1+a.t)-l.x/l.t);
            let q = Math.atan2(b.y/(1+b.t)-l.y/l.t,b.x/(1+b.t)-l.x/l.t);
            if (q > p + Math.PI) { q -= 2*Math.PI; }
            if (p > q + Math.PI) { p -= 2*Math.PI; }
            let ccw = p > q;
            this.ctx.arc(this.cx+this.s*l.x/l.t, this.cy+this.s*l.y/l.t, this.s*r, p, q, ccw);
        }
        else {
            this.ctx.lineTo(this.cx+this.s*a.x/(1+a.t), this.cy+this.s*a.y/(1+a.t));
            this.ctx.lineTo(this.cx+this.s*b.x/(1+b.t), this.cy+this.s*b.y/(1+b.t));
        }
    }
    moveTo(a: vec3): void {
        this.ctx.moveTo(this.cx+this.s*a.x/(1+a.t), this.cy+this.s*a.y/(1+a.t));
    }
}
