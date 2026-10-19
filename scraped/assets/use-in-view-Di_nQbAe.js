import{c as g,ah as I,r as h}from"./app-VGjPtK0-.js";/**
 * @license lucide-react v0.460.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const v=g("Check",[["path",{d:"M20 6 9 17l-5-5",key:"1gmf2c"}]]),p={some:0,all:1};function E(s,r,{root:c,margin:i,amount:t="some"}={}){const a=I(s),n=new WeakMap,f=u=>{u.forEach(e=>{const l=n.get(e.target);if(e.isIntersecting!==!!l)if(e.isIntersecting){const d=r(e);typeof d=="function"?n.set(e.target,d):o.unobserve(e.target)}else l&&(l(e),n.delete(e.target))})},o=new IntersectionObserver(f,{root:c,rootMargin:i,threshold:typeof t=="number"?t:p[t]});return a.forEach(u=>o.observe(u)),()=>o.disconnect()}function b(s,{root:r,margin:c,amount:i,once:t=!1}={}){const[a,n]=h.useState(!1);return h.useEffect(()=>{if(!s.current||t&&a)return;const f=()=>(n(!0),t?void 0:()=>n(!1)),o={root:r&&r.current||void 0,margin:c,amount:i};return E(s.current,f,o)},[r,s,c,t,i]),a}export{v as C,b as u};
