"use strict";(self.webpackChunkmy_website=self.webpackChunkmy_website||[]).push([[3080],{3905:(e,t,n)=>{n.d(t,{Zo:()=>l,kt:()=>f});var r=n(7294);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function a(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function s(e,t){if(null==e)return{};var n,r,i=function(e,t){if(null==e)return{};var n,r,i={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var c=r.createContext({}),d=function(e){var t=r.useContext(c),n=t;return e&&(n="function"==typeof e?e(t):a(a({},t),e)),n},l=function(e){var t=d(e.components);return r.createElement(c.Provider,{value:t},e.children)},m="mdxType",p={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},u=r.forwardRef((function(e,t){var n=e.components,i=e.mdxType,o=e.originalType,c=e.parentName,l=s(e,["components","mdxType","originalType","parentName"]),m=d(n),u=i,f=m["".concat(c,".").concat(u)]||m[u]||p[u]||o;return n?r.createElement(f,a(a({ref:t},l),{},{components:n})):r.createElement(f,a({ref:t},l))}));function f(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var o=n.length,a=new Array(o);a[0]=u;var s={};for(var c in t)hasOwnProperty.call(t,c)&&(s[c]=t[c]);s.originalType=e,s[m]="string"==typeof e?e:i,a[1]=s;for(var d=2;d<o;d++)a[d]=n[d];return r.createElement.apply(null,a)}return r.createElement.apply(null,n)}u.displayName="MDXCreateElement"},8626:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>a,default:()=>p,frontMatter:()=>o,metadata:()=>s,toc:()=>d});var r=n(7462),i=(n(7294),n(3905));const o={},a="DIDs and DIDComm",s={unversionedId:"concepts/did-and-didcomm",id:"concepts/did-and-didcomm",title:"DIDs and DIDComm",description:"DIDs",source:"@site/guides/concepts/did-and-didcomm.md",sourceDirName:"concepts",slug:"/concepts/did-and-didcomm",permalink:"/guides/next/concepts/did-and-didcomm",draft:!1,tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Agents",permalink:"/guides/next/concepts/agents"},next:{title:"Platform and Environment",permalink:"/guides/next/concepts/platform-and-environment"}},c={},d=[{value:"DIDs",id:"dids",level:3},{value:"DID Documents",id:"did-documents",level:3},{value:"DIDComm",id:"didcomm",level:3},{value:"Useful Resources",id:"useful-resources",level:3}],l={toc:d},m="wrapper";function p(e){let{components:t,...n}=e;return(0,i.kt)(m,(0,r.Z)({},l,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"dids-and-didcomm"},"DIDs and DIDComm"),(0,i.kt)("h3",{id:"dids"},"DIDs"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://www.w3.org/TR/did-core/"},"DIDs"),", short for Decentralized identifiers,\nare a type of identifier that enables verifiable, decentralized identity. A DID\ncan refer to any subject, a person, organization, etc. DIDs are decoupled from\ncentralized registries, identity providers and certificate authorities."),(0,i.kt)("h3",{id:"did-documents"},"DID Documents"),(0,i.kt)("p",null,"A DID by itself does not contain a lot of information. So in order to get some\nmetadata we have to resolve the DID to get a ",(0,i.kt)("a",{parentName:"p",href:"https://www.w3.org/TR/did-core/#dfn-did-documents"},"DID Document"),". With this\ndocument we can get data such as their public key, proof mechanisms and their\nservice endpoints. This means that we can check the validity, encrypt\none-to-one messages and send it to their service endpoint."),(0,i.kt)("h3",{id:"didcomm"},"DIDComm"),(0,i.kt)("p",null,"In the previous section sending a message to their service endpoint is\nmentioned. This is a nice feature, but is lacking a definition of how it should\nwork. ",(0,i.kt)("a",{parentName:"p",href:"https://identity.foundation/didcomm-messaging/spec/"},"DIDComm"),", we will\nonly discuss V1 here, defines this. DIDComm is designed to be private, secure,\ntransport-agnostic, interoperable and much more. This means that you can\nsecurely send a message from as Alice to Bob securely via bluetooth, HTTP,\nWebSockets, etc."),(0,i.kt)("p",null,"When working with the tools available inside the Aries JavaScript ecosystem,\ndeep knowledge of DIDComm is not required."),(0,i.kt)("h3",{id:"useful-resources"},"Useful Resources"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"https://www.w3.org/TR/did-core/"},"DID spec")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"https://identity.foundation/didcomm-messaging/spec/"},"DIDComm spec"))))}p.isMDXComponent=!0}}]);