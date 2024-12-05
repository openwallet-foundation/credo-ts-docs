"use strict";(self.webpackChunkcredo_ts_docs=self.webpackChunkcredo_ts_docs||[]).push([[7822],{3905:(e,n,t)=>{t.d(n,{Zo:()=>p,kt:()=>h});var a=t(67294);function r(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function o(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);n&&(a=a.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,a)}return t}function i(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?o(Object(t),!0).forEach((function(n){r(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):o(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function d(e,n){if(null==e)return{};var t,a,r=function(e,n){if(null==e)return{};var t,a,r={},o=Object.keys(e);for(a=0;a<o.length;a++)t=o[a],n.indexOf(t)>=0||(r[t]=e[t]);return r}(e,n);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)t=o[a],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(r[t]=e[t])}return r}var s=a.createContext({}),l=function(e){var n=a.useContext(s),t=n;return e&&(t="function"==typeof e?e(n):i(i({},n),e)),t},p=function(e){var n=l(e.components);return a.createElement(s.Provider,{value:n},e.children)},u="mdxType",c={inlineCode:"code",wrapper:function(e){var n=e.children;return a.createElement(a.Fragment,{},n)}},m=a.forwardRef((function(e,n){var t=e.components,r=e.mdxType,o=e.originalType,s=e.parentName,p=d(e,["components","mdxType","originalType","parentName"]),u=l(t),m=r,h=u["".concat(s,".").concat(m)]||u[m]||c[m]||o;return t?a.createElement(h,i(i({ref:n},p),{},{components:t})):a.createElement(h,i({ref:n},p))}));function h(e,n){var t=arguments,r=n&&n.mdxType;if("string"==typeof e||r){var o=t.length,i=new Array(o);i[0]=m;var d={};for(var s in n)hasOwnProperty.call(n,s)&&(d[s]=n[s]);d.originalType=e,d[u]="string"==typeof e?e:r,i[1]=d;for(var l=2;l<o;l++)i[l]=t[l];return a.createElement.apply(null,i)}return a.createElement.apply(null,t)}m.displayName="MDXCreateElement"},85162:(e,n,t)=>{t.d(n,{Z:()=>i});var a=t(67294),r=t(86010);const o={tabItem:"tabItem_Ymn6"};function i(e){let{children:n,hidden:t,className:i}=e;return a.createElement("div",{role:"tabpanel",className:(0,r.Z)(o.tabItem,i),hidden:t},n)}},74866:(e,n,t)=>{t.d(n,{Z:()=>w});var a=t(87462),r=t(67294),o=t(86010),i=t(12466),d=t(16550),s=t(91980),l=t(67392),p=t(50012);function u(e){return function(e){return r.Children.map(e,(e=>{if((0,r.isValidElement)(e)&&"value"in e.props)return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))}(e).map((e=>{let{props:{value:n,label:t,attributes:a,default:r}}=e;return{value:n,label:t,attributes:a,default:r}}))}function c(e){const{values:n,children:t}=e;return(0,r.useMemo)((()=>{const e=n??u(t);return function(e){const n=(0,l.l)(e,((e,n)=>e.value===n.value));if(n.length>0)throw new Error(`Docusaurus error: Duplicate values "${n.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[n,t])}function m(e){let{value:n,tabValues:t}=e;return t.some((e=>e.value===n))}function h(e){let{queryString:n=!1,groupId:t}=e;const a=(0,d.k6)(),o=function(e){let{queryString:n=!1,groupId:t}=e;if("string"==typeof n)return n;if(!1===n)return null;if(!0===n&&!t)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return t??null}({queryString:n,groupId:t});return[(0,s._X)(o),(0,r.useCallback)((e=>{if(!o)return;const n=new URLSearchParams(a.location.search);n.set(o,e),a.replace({...a.location,search:n.toString()})}),[o,a])]}function f(e){const{defaultValue:n,queryString:t=!1,groupId:a}=e,o=c(e),[i,d]=(0,r.useState)((()=>function(e){let{defaultValue:n,tabValues:t}=e;if(0===t.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(n){if(!m({value:n,tabValues:t}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${n}" but none of its children has the corresponding value. Available values are: ${t.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return n}const a=t.find((e=>e.default))??t[0];if(!a)throw new Error("Unexpected error: 0 tabValues");return a.value}({defaultValue:n,tabValues:o}))),[s,l]=h({queryString:t,groupId:a}),[u,f]=function(e){let{groupId:n}=e;const t=function(e){return e?`docusaurus.tab.${e}`:null}(n),[a,o]=(0,p.Nk)(t);return[a,(0,r.useCallback)((e=>{t&&o.set(e)}),[t,o])]}({groupId:a}),k=(()=>{const e=s??u;return m({value:e,tabValues:o})?e:null})();(0,r.useLayoutEffect)((()=>{k&&d(k)}),[k]);return{selectedValue:i,selectValue:(0,r.useCallback)((e=>{if(!m({value:e,tabValues:o}))throw new Error(`Can't select invalid tab value=${e}`);d(e),l(e),f(e)}),[l,f,o]),tabValues:o}}var k=t(72389);const g={tabList:"tabList__CuJ",tabItem:"tabItem_LNqP"};function v(e){let{className:n,block:t,selectedValue:d,selectValue:s,tabValues:l}=e;const p=[],{blockElementScrollPositionUntilNextRender:u}=(0,i.o5)(),c=e=>{const n=e.currentTarget,t=p.indexOf(n),a=l[t].value;a!==d&&(u(n),s(a))},m=e=>{let n=null;switch(e.key){case"Enter":c(e);break;case"ArrowRight":{const t=p.indexOf(e.currentTarget)+1;n=p[t]??p[0];break}case"ArrowLeft":{const t=p.indexOf(e.currentTarget)-1;n=p[t]??p[p.length-1];break}}n?.focus()};return r.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,o.Z)("tabs",{"tabs--block":t},n)},l.map((e=>{let{value:n,label:t,attributes:i}=e;return r.createElement("li",(0,a.Z)({role:"tab",tabIndex:d===n?0:-1,"aria-selected":d===n,key:n,ref:e=>p.push(e),onKeyDown:m,onClick:c},i,{className:(0,o.Z)("tabs__item",g.tabItem,i?.className,{"tabs__item--active":d===n})}),t??n)})))}function y(e){let{lazy:n,children:t,selectedValue:a}=e;if(t=Array.isArray(t)?t:[t],n){const e=t.find((e=>e.props.value===a));return e?(0,r.cloneElement)(e,{className:"margin-top--md"}):null}return r.createElement("div",{className:"margin-top--md"},t.map(((e,n)=>(0,r.cloneElement)(e,{key:n,hidden:e.props.value!==a}))))}function b(e){const n=f(e);return r.createElement("div",{className:(0,o.Z)("tabs-container",g.tabList)},r.createElement(v,(0,a.Z)({},e,n)),r.createElement(y,(0,a.Z)({},e,n)))}function w(e){const n=(0,k.Z)();return r.createElement(b,(0,a.Z)({key:String(n)},e))}},82268:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>p,contentTitle:()=>s,default:()=>h,frontMatter:()=>d,metadata:()=>l,toc:()=>u});var a=t(87462),r=(t(67294),t(3905)),o=t(74866),i=t(85162);const d={},s="Migrating from Credo 0.4.x to 0.5.x",l={unversionedId:"updating/versions/0.4-to-0.5",id:"updating/versions/0.4-to-0.5",title:"Migrating from Credo 0.4.x to 0.5.x",description:"This document describes everything you need to know for updating Credo 0.4.x to 0.5.x. If you're not aware of how updating in Credo works make sure to first read the guide on Updating Credo, and the Update Assistant. Starting from Credo 0.5, we now support migration of tenant storage in addition to the root wallet. If you're using the tenants module, make sure to read the guides carefully.",source:"@site/guides/updating/versions/0.4-to-0.5.md",sourceDirName:"updating/versions",slug:"/updating/versions/0.4-to-0.5",permalink:"/guides/updating/versions/0.4-to-0.5",draft:!1,tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"Migrating from Credo 0.3.x to 0.4.x",permalink:"/guides/updating/versions/0.3-to-0.4"},next:{title:"The Credo Ecosystem",permalink:"/guides/ecosystem/"}},p={},u=[{value:"React Native",id:"react-native",level:4},{value:"Node",id:"node",level:4},{value:"Breaking Code Changes",id:"breaking-code-changes",level:2},{value:"Node 16 deprecated",id:"node-16-deprecated",level:3},{value:"Aries to Credo",id:"aries-to-credo",level:3},{value:"Label optional in <code>OutOfBandInvitation</code>",id:"label-optional-in-outofbandinvitation",level:3},{value:"Caching in <code>DidResolver</code> interface",id:"caching-in-didresolver-interface",level:3},{value:"Out Of Band Handshake Protocols enum updated to not include minor version",id:"out-of-band-handshake-protocols-enum-updated-to-not-include-minor-version",level:3},{value:"AnonCreds RS and AnonCreds package combined",id:"anoncreds-rs-and-anoncreds-package-combined",level:3},{value:"0.4.x",id:"04x",level:5},{value:"0.5.x",id:"05x",level:5},{value:"OpenId4VC Holder module",id:"openid4vc-holder-module",level:3},{value:"0.4.x",id:"04x-1",level:5},{value:"0.5.x",id:"05x-1",level:5},{value:"0.4.x",id:"04x-2",level:5},{value:"0.5.x",id:"05x-2",level:5},{value:"Message Pickup",id:"message-pickup",level:3},{value:"Askar short-lived sessions",id:"askar-short-lived-sessions",level:3},{value:"AnonCreds W3C format",id:"anoncreds-w3c-format",level:3}],c={toc:u},m="wrapper";function h(e){let{components:n,...t}=e;return(0,r.kt)(m,(0,a.Z)({},c,t,{components:n,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"migrating-from-credo-04x-to-05x"},"Migrating from Credo 0.4.x to 0.5.x"),(0,r.kt)("p",null,"This document describes everything you need to know for updating Credo 0.4.x to 0.5.x. If you're not aware of how updating in Credo works make sure to first read the guide on ",(0,r.kt)("a",{parentName:"p",href:"/guides/updating/"},"Updating Credo"),", and the ",(0,r.kt)("a",{parentName:"p",href:"/guides/updating/update-assistant"},"Update Assistant"),". Starting from Credo 0.5, we now support migration of tenant storage in addition to the root wallet. If you're using the tenants module, make sure to read the guides carefully."),(0,r.kt)("p",null,"See ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/openwallet-foundation/credo-ts/pull/1747"},"Pull Request 1747")," for more information.)."),(0,r.kt)("p",null,"First of all, update your dependencies to the 0.5.x versions. This will also update the needed peer dependencies. ",(0,r.kt)("strong",{parentName:"p"},"Extension packages are not updated with this command"),". You need to update these manually, and make sure they're up to date with the latest version of Credo."),(0,r.kt)("p",null,"Credo 0.5.0 is a major release, but there haven't been a lot of breaking changes to the stable API, most of the changes are related to OpenID4VC, SD-JWT VC and DIF Presentation Exchange. One notable change is that the Indy SDK has been fully deprecated and removed from Credo. This means that starting from 0.5, you cannot use Credo with the Indy SDK. If you need to migrate your storage from Indy SDK to Aries Askar, see the note below for instructions. Another notable change is the migration of all AnonCreds credential records to be stored as ",(0,r.kt)("inlineCode",{parentName:"p"},"W3cCredentialRecord")," instead of ",(0,r.kt)("inlineCode",{parentName:"p"},"AnonCredsCredentialRecord"),"."),(0,r.kt)("p",null,"Follow the mentioned steps in this document carefully to make the upgrade as smooth as possible."),(0,r.kt)("admonition",{type:"caution"},(0,r.kt)("p",{parentName:"admonition"},"The migration guide only covers how to migrate from 0.4.x to 0.5.x while keeping the same behavior and dependencies. Credo 0.4.0 added support for ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/hyperledger/aries-askar"},"Aries Askar"),", ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/hyperledger/indy-vdr"},"Indy VDR")," and ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/hyperledger/anoncreds-rs"},"AnonCreds RS")," as a replacement for the Indy SDK."),(0,r.kt)("p",{parentName:"admonition"},"Migrating to these new components requires additional migration steps, which need to be closely followed to prevent loss of data. These can be found at the ",(0,r.kt)("a",{parentName:"p",href:"/guides/updating/update-indy-sdk-to-askar"},"Update Indy SDK to Askar guide"),"."),(0,r.kt)("p",{parentName:"admonition"},"As noted in the ",(0,r.kt)("a",{parentName:"p",href:"/guides/updating/update-indy-sdk-to-askar"},"Update Indy SDK to Askar guide"),", it is very important that the 0.3.x or 0.4x to 0.5.x update is started after migrating from the Indy SDK to Aries Askar."),(0,r.kt)("p",{parentName:"admonition"},"The rest of this guides will ",(0,r.kt)("strong",{parentName:"p"},"assume you have already migrated from the Indy SDK to Aries Askar, AnonCreds and Indy VDR"),".")),(0,r.kt)("admonition",{type:"caution"},(0,r.kt)("p",{parentName:"admonition"},"The following APIs, modules and features are experimental and therefore not covered by the semver versioning in Credo. If you're using any of these features, make sure to use an exact version of Credo (",(0,r.kt)("inlineCode",{parentName:"p"},"0.5.0"),") instead of a range (",(0,r.kt)("inlineCode",{parentName:"p"},"^0.5.0"),"):"),(0,r.kt)("ul",{parentName:"admonition"},(0,r.kt)("li",{parentName:"ul"},"Issuance of revocable AnonCreds credentials and revocation of AnonCreds credentials"),(0,r.kt)("li",{parentName:"ul"},"Using any of the OpenID4VC from the ",(0,r.kt)("inlineCode",{parentName:"li"},"@credo-ts/openid4vc")," package"),(0,r.kt)("li",{parentName:"ul"},"SD-JWT Verifiable Credentials"),(0,r.kt)("li",{parentName:"ul"},"DIF Presentation Exchange"),(0,r.kt)("li",{parentName:"ul"},"Issuance and verification of AnonCreds in W3C Verifiable Credential format"))),(0,r.kt)("p",null,"First install the updated dependencies. For all dependencies you have in ",(0,r.kt)("inlineCode",{parentName:"p"},"package.json"),", update them to the following versions, for your platform. If you don't use a package, you don't have to add it here."),(0,r.kt)("p",null,"In the upgrade from 0.4 to 0.5, Aries Framework JavaScript has been renamed to Credo, and therefore the package scope has also changed. ",(0,r.kt)("strong",{parentName:"p"},"The scope for all packages starting with ",(0,r.kt)("inlineCode",{parentName:"strong"},"@aries-framework")," should be updated to ",(0,r.kt)("inlineCode",{parentName:"strong"},"@credo-ts")),". So ",(0,r.kt)("inlineCode",{parentName:"p"},"@aries-framework/core")," becomes ",(0,r.kt)("inlineCode",{parentName:"p"},"@credo-ts/core"),", etc.."),(0,r.kt)("p",null,"If you were using ",(0,r.kt)("inlineCode",{parentName:"p"},"@aries-framework/anoncreds")," and ",(0,r.kt)("inlineCode",{parentName:"p"},"@aries-framework/anoncreds-rs"),", these have been combined into ",(0,r.kt)("inlineCode",{parentName:"p"},"@credo-ts/anoncreds"),". So ",(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"@aries-framework/anoncreds-rs")," can be removed from the dependencies"),"."),(0,r.kt)(o.Z,{mdxType:"Tabs"},(0,r.kt)(i.Z,{label:"React Native",value:"tab1",mdxType:"TabItem"},(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},'"@credo-ts/*": "^0.5.3"')," - except for packages starting with ",(0,r.kt)("inlineCode",{parentName:"li"},"@credo-ts")," listed below."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},'"@credo-ts/react-hooks": "^0.6.1"')),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},'"@credo-ts/push-notifications": "^0.7.1"')),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},'"@hyperledger/anoncreds-react-native": "^0.2.2"')),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},'"@hyperledger/indy-vdr-react-native": "^0.2.2"')),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},'"@hyperledger/aries-askar-react-native": "^0.2.1"'))),(0,r.kt)("p",null,"In addition, if you were using ",(0,r.kt)("inlineCode",{parentName:"p"},"@aries-framework/anoncreds")," and ",(0,r.kt)("inlineCode",{parentName:"p"},"@aries-framework/anoncreds-rs"),", these have been combined into ",(0,r.kt)("inlineCode",{parentName:"p"},"@credo-ts/anoncreds"),". So ",(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"@aries-framework/anoncreds-rs")," can be removed from the dependencies"),".")),(0,r.kt)(i.Z,{label:"Node",value:"tab2",mdxType:"TabItem"},(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},'"@credo-ts/*": "^0.5.3"')," - except for packages starting with ",(0,r.kt)("inlineCode",{parentName:"li"},"@credo-ts")," listed below."),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},'"@credo-ts/react-hooks": "^0.6.1"')),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},'"@credo-ts/push-notifications": "^0.7.1"')),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},'"@hyperledger/anoncreds-nodejs": "^0.2.1"')),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},'"@hyperledger/indy-vdr-nodejs": "^0.2.1"')),(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},'"@hyperledger/aries-askar-nodejs": "^0.2.0"'))))),(0,r.kt)("h2",{id:"breaking-code-changes"},"Breaking Code Changes"),(0,r.kt)("p",null,"This section will list all breaking changes made to the public API of Credo between version 0.4.x and 0.5.x."),(0,r.kt)("admonition",{type:"info"},(0,r.kt)("p",{parentName:"admonition"},"If you have custom modules take into account there could be a lot more breaking changes that aren't documented here. We try to make sure that the biggest breaking changes to the internal API are also documented here, but it is possible some breaking changes are not documented here (feel free to open a pull request).")),(0,r.kt)("h3",{id:"node-16-deprecated"},"Node 16 deprecated"),(0,r.kt)("p",null,"Starting from Credo 0.5, Node 16 has been deprecated and is no longer supported. The supported versions for Credo are Node 18 and 20. We aim to keep support for all LTS releases (the even version numbers) that are either Current, Active, or in Maintenance. Other versions may work, but are not part of our testing and release process."),(0,r.kt)("p",null,"See the ",(0,r.kt)("a",{parentName:"p",href:"https://nodejs.org/en/about/previous-releases#release-schedule"},"Release Schedule")," on the Node.js website for information on past and upcoming Node.js releases."),(0,r.kt)("h3",{id:"aries-to-credo"},"Aries to Credo"),(0,r.kt)("p",null,"With the move from Aries Framework JavaScript to Credo, several classes and imports have been renamed to match the new name. The following imports should be updated:"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},(0,r.kt)("inlineCode",{parentName:"li"},"AriesFrameworkError")," -> ",(0,r.kt)("inlineCode",{parentName:"li"},"CredoError"))),(0,r.kt)("h3",{id:"label-optional-in-outofbandinvitation"},"Label optional in ",(0,r.kt)("inlineCode",{parentName:"h3"},"OutOfBandInvitation")),(0,r.kt)("p",null,"A small change, but the ",(0,r.kt)("inlineCode",{parentName:"p"},"label")," property on an ",(0,r.kt)("inlineCode",{parentName:"p"},"OutOfBandInvitation")," is now optional."),(0,r.kt)("h3",{id:"caching-in-didresolver-interface"},"Caching in ",(0,r.kt)("inlineCode",{parentName:"h3"},"DidResolver")," interface"),(0,r.kt)("p",null,"Did resolving within Credo now support caching of resolved did documents. Especially in some flows where the did document is resolved several times, this can improve performance a lot."),(0,r.kt)("p",null,"If you haven't implemented a custom ",(0,r.kt)("inlineCode",{parentName:"p"},"DidResolver"),", you don't have to do anything to benefit from the new caching behavior, this is enabled by default. If you want to opt out of caching (and have the same behavior as 0.4), you can tweak it using the following properties in the did resolver options:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-typescript"},"const didResult = await agent.dids.resolve('did:example:123', {\n  // how long to cache the resolved did document in seconds\n  cacheDurationInSeconds: 400,\n  // whether to persist the resolved did document in the cache\n  persistInCache: true,\n  // whether to use the cache for resolving the did document\n  useCache: true,\n})\n")),(0,r.kt)("p",null,"If you have implemented a custom did resolver, you need to set the ",(0,r.kt)("inlineCode",{parentName:"p"},"allowsCaching")," property to indicate whether the did resolver allows the documents it resolves to be cached. For example, for local resolvers it's often easier to resolve the document than to have it cached, so you can set ",(0,r.kt)("inlineCode",{parentName:"p"},"allowsCaching")," to ",(0,r.kt)("inlineCode",{parentName:"p"},"false")," (example are ",(0,r.kt)("inlineCode",{parentName:"p"},"did:key"),", ",(0,r.kt)("inlineCode",{parentName:"p"},"did:jwk"),", ",(0,r.kt)("inlineCode",{parentName:"p"},"did:peer"),"). For resolvers that resolve documents from a remote source, it's often better to cache the resolved document, so you can set ",(0,r.kt)("inlineCode",{parentName:"p"},"allowsCaching")," to ",(0,r.kt)("inlineCode",{parentName:"p"},"true")," (example are ",(0,r.kt)("inlineCode",{parentName:"p"},"did:web"),", ",(0,r.kt)("inlineCode",{parentName:"p"},"did:cheqd"),", ",(0,r.kt)("inlineCode",{parentName:"p"},"did:indy"),")."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-typescript"},"export class ExampleDidResolver implements DidResolver {\n  public readonly supportedMethods = ['example']\n\n  // whether to allow caching\n  public readonly allowsCaching = true\n\n  public async resolve() {\n    // ... resolver implementation\n  }\n}\n")),(0,r.kt)("h3",{id:"out-of-band-handshake-protocols-enum-updated-to-not-include-minor-version"},"Out Of Band Handshake Protocols enum updated to not include minor version"),(0,r.kt)("p",null,"The ",(0,r.kt)("inlineCode",{parentName:"p"},"HandshakeProtocol")," enum, which you can provide when creating out of band invitations, has been updated to not include the minor version in the values anymore. The minor version has instead been replaced by an ",(0,r.kt)("inlineCode",{parentName:"p"},"x"),", indicating it can be any value. If you were only using the enum, this should not cause issues. But if you were relying on the values within the enum to have a specific format, this could cause some issues."),(0,r.kt)("p",null,"For example the value for ",(0,r.kt)("inlineCode",{parentName:"p"},"HandshakeProtocol.DidExchange")," has been updated from ",(0,r.kt)("inlineCode",{parentName:"p"},"https://didcomm.org/didexchange/1.1")," to ",(0,r.kt)("inlineCode",{parentName:"p"},"https://didcomm.org/didexchange/1.x"),"."),(0,r.kt)("h3",{id:"anoncreds-rs-and-anoncreds-package-combined"},"AnonCreds RS and AnonCreds package combined"),(0,r.kt)("p",null,"With the removal of the Indy SDK from Credo, we have made the setup for AnonCreds easier."),(0,r.kt)("p",null,"In 0.4 you had to provide both the ",(0,r.kt)("inlineCode",{parentName:"p"},"AnonCredsModule")," (from ",(0,r.kt)("inlineCode",{parentName:"p"},"@aries-framework/anoncreds"),") as well as the ",(0,r.kt)("inlineCode",{parentName:"p"},"AnonCredsRsModule")," (from ",(0,r.kt)("inlineCode",{parentName:"p"},"@aries-framework/anoncreds-rs"),"). In 0.5 these have been combined into a single ",(0,r.kt)("inlineCode",{parentName:"p"},"AnonCredsModule")," (from ",(0,r.kt)("inlineCode",{parentName:"p"},"@credo-ts/anoncreds"),")."),(0,r.kt)(o.Z,{mdxType:"Tabs"},(0,r.kt)(i.Z,{label:"0.4.x",value:"tab1",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"import { Agent } from '@aries-framework/core'\nimport { AnonCredsModule } from '@aries-framework/anoncreds'\n\n// or import from @hyperledger/anoncreds-react-native in React Native\nimport { anoncreds } from '@hyperledger/anoncreds-nodejs'\n\nconst agent = new Agent({\n  /* ... rest of agent setup */\n\n  modules: {\n    anoncreds: new AnonCredsModule({\n      registries: [\n        /* registries */\n      ],\n    }),\n    anoncredsRs: new AnonCredsRsModule({\n      anoncreds,\n    }),\n  },\n})\n"))),(0,r.kt)(i.Z,{label:"0.5.x",value:"tab2",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"import { Agent } from 'credo-ts/core'\nimport { AnonCredsModule } from 'credo-ts/anoncreds'\n\n// or import from @hyperledger/anoncreds-react-native in React Native\nimport { anoncreds } from '@hyperledger/anoncreds-nodejs'\n\nconst agent = new Agent({\n  /* ... rest of agent setup */\n\n  modules: {\n    anoncreds: new AnonCredsModule({\n      registries: [\n        /* registries */\n      ],\n\n      // anoncreds has been moved to AnonCredsModule\n      anoncreds,\n    }),\n  },\n})\n")))),(0,r.kt)("h3",{id:"openid4vc-holder-module"},"OpenId4VC Holder module"),(0,r.kt)("p",null,"The ",(0,r.kt)("inlineCode",{parentName:"p"},"@aries-framework/openid4vc-client")," has been deprecated in favour of the new ",(0,r.kt)("inlineCode",{parentName:"p"},"@credo-ts/openid4vc")," package."),(0,r.kt)("p",null,"The OpenID4VC Client from Credo/AFJ 0.4 only supported receiving credential using OpenID for Verifiable Credentials Issuance. The new package now also support issuance, proving and verification. This section covers how to update the existing functionality to Credo 0.5, but for a detailed guide on how to use the new OpenID4VC features in Credo, see ",(0,r.kt)("a",{parentName:"p",href:"/guides/oid4vc/index.md"},"OpenID4VC Guide"),"."),(0,r.kt)("p",null,"First update the import of ",(0,r.kt)("inlineCode",{parentName:"p"},"@aries-framework/openid4vc-client")," to ",(0,r.kt)("inlineCode",{parentName:"p"},"@credo-ts/openid4vc"),", and change the module to the new ",(0,r.kt)("inlineCode",{parentName:"p"},"OpenId4VcHolderModule"),":"),(0,r.kt)(o.Z,{mdxType:"Tabs"},(0,r.kt)(i.Z,{label:"0.4.x",value:"tab1",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"import { Agent } from '@aries-framework/core'\nimport { OpenId4VcClientModule } from '@aries-framework/openid4vc-client'\n\n// Import from @aries-framework/react-native in React Native\nimport { agentDependencies } from '@aries-framework/node'\n\nconst agent = new Agent({\n  config: {\n    /* ... */\n  },\n  dependencies: agentDependencies,\n  modules: {\n    /* ... other modules */\n    openId4VcClient: new OpenId4VcClientModule(),\n  },\n})\n"))),(0,r.kt)(i.Z,{label:"0.5.x",value:"tab2",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"import { Agent } from '@aries-framework/core'\nimport { OpenId4VcHolderModule } from '@aries-framework/openid4vc'\n\n// Import from @aries-framework/react-native in React Native\nimport { agentDependencies } from '@aries-framework/node'\n\nconst agent = new Agent({\n  config: {\n    /* ... */\n  },\n  dependencies: agentDependencies,\n  modules: {\n    /* ... other modules */\n    openId4VcHolder: new OpenId4VcHolderModule(),\n  },\n})\n")))),(0,r.kt)("p",null,"Next, update your credential receiving logic to first resolve the credential offer (using ",(0,r.kt)("inlineCode",{parentName:"p"},"agent.modules.openId4VcHolder.resolveCredentialOffer"),"), and then accept the credential offer (using ",(0,r.kt)("inlineCode",{parentName:"p"},"agent.modules.openId4VcHolder.acceptCredentialOfferUsingPreAuthorizedCode"),")."),(0,r.kt)(o.Z,{mdxType:"Tabs"},(0,r.kt)(i.Z,{label:"0.4.x",value:"tab1",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"import { DidKey, KeyDidCreateOptions, JwaSignatureAlgorithm } from '@aries-framework/core'\nimport { OpenIdCredentialFormatProfile } from '@aries-framework/openid4vc-client'\n\n// Example uri\nconst data = 'openid-credential-offer://?credential_offer_uri=...'\n\nawait agent.modules.openId4VcClient.requestCredentialUsingPreAuthorizedCode({\n  uri: data,\n  proofOfPossessionVerificationMethodResolver: async ({ supportedDidMethods, keyType, supportsAllDidMethods }) => {\n    if (supportsAllDidMethods || supportedDidMethods?.includes('did:key')) {\n      const didResult = await agent.dids.create<KeyDidCreateOptions>({\n        method: 'key',\n        options: {\n          keyType,\n        },\n      })\n\n      if (didResult.didState.state !== 'finished') {\n        throw new Error('DID creation failed.')\n      }\n\n      const didKey = DidKey.fromDid(didResult.didState.did)\n\n      return didResult.didState.didDocument.dereferenceKey(`${didKey.did}#${didKey.key.fingerprint}`)\n    }\n\n    throw new Error(`Unable to create a key binding`)\n  },\n  verifyCredentialStatus: false,\n  allowedCredentialFormats: [OpenIdCredentialFormatProfile.JwtVcJson],\n  allowedProofOfPossessionSignatureAlgorithms: [JwaSignatureAlgorithm.EdDSA, JwaSignatureAlgorithm.ES256],\n})\n"))),(0,r.kt)(i.Z,{label:"0.5.x",value:"tab2",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"import { DidKey, KeyDidCreateOptions, JwaSignatureAlgorithm, getJwkFromKey } from '@credo-ts/core'\nimport { OpenId4VciCredentialFormatProfile } from '@credo-ts/openid4vc'\n\n// Example uri\nconst data = 'openid-credential-offer://?credential_offer_uri=...'\n\nconst resolvedCredentialOffer = await agent.modules.openId4VcHolder.resolveCredentialOffer(data)\n\nawait agent.modules.openId4VcHolder.acceptCredentialOfferUsingPreAuthorizedCode(\n  // First parameter is now the resolved credential offer\n  resolvedCredentialOffer,\n  {\n    // has been renamed from proofOfPossessionVerificationMethodResolver to credentialBindingResolver\n    credentialBindingResolver: async ({\n      supportedDidMethods,\n      keyType,\n      supportsAllDidMethods,\n      // supportsJwk now also passed\n      supportsJwk,\n      credentialFormat,\n    }) => {\n      // NOTE: example implementation. Adjust based on your needs\n      // Return the binding to the credential that should be used. Either did or jwk is supported\n\n      if (supportsAllDidMethods || supportedDidMethods?.includes('did:key')) {\n        const didResult = await agent.dids.create<KeyDidCreateOptions>({\n          method: 'key',\n          options: {\n            keyType,\n          },\n        })\n\n        if (didResult.didState.state !== 'finished') {\n          throw new Error('DID creation failed.')\n        }\n\n        const didKey = DidKey.fromDid(didResult.didState.did)\n\n        // you now need to return an object instead of VerificationMethod instance\n        // and method 'did' or 'jwk'\n        return {\n          method: 'did',\n          didUrl: `${didKey.did}#${didKey.key.fingerprint}`,\n        }\n      }\n\n      // we also support plain jwk for sd-jwt only\n      if (supportsJwk && credentialFormat === OpenId4VciCredentialFormatProfile.SdJwtVc) {\n        const key = await agent.wallet.createKey({\n          keyType,\n        })\n\n        // you now need to return an object instead of VerificationMethod instance\n        // and method 'did' or 'jwk'\n        return {\n          method: 'jwk',\n          jwk: getJwkFromKey(key),\n        }\n      }\n\n      throw new Error('Unable to create a key binding')\n    },\n\n    verifyCredentialStatus: false,\n    allowedProofOfPossessionSignatureAlgorithms: [JwaSignatureAlgorithm.EdDSA, JwaSignatureAlgorithm.ES256],\n  }\n)\n")))),(0,r.kt)("h3",{id:"message-pickup"},"Message Pickup"),(0,r.kt)("blockquote",null,(0,r.kt)("p",{parentName:"blockquote"},"TODO: write migration guide for message pickup\n",(0,r.kt)("a",{parentName:"p",href:"https://github.com/openwallet-foundation/credo-ts/pull/1638"},"https://github.com/openwallet-foundation/credo-ts/pull/1638"))),(0,r.kt)("h3",{id:"askar-short-lived-sessions"},"Askar short-lived sessions"),(0,r.kt)("p",null,"This is an internal change, but Askar now only uses short-lived sessions. Before a session was created and kept alive until the agent was shutdown or the tenant session was closed (in case of multi-tenancy). Now a session is created for each read and write operation to your wallet."),(0,r.kt)("p",null,"Askar manages a connection pool internally and aligns more with how Askar is supposed to be used, and makes the multi-tenancy implementation more robust. This is also in preparation for some bigger wallet and storage API changes in future versions, where we want to support transactions (batching multiple read/writes operations), record locking (to prevent race condition updates), and more."),(0,r.kt)("p",null,"See ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/openwallet-foundation/credo-ts/pull/1743"},"Pull Request 1743")," for more information."),(0,r.kt)("h3",{id:"anoncreds-w3c-format"},"AnonCreds W3C format"),(0,r.kt)("p",null,"AnonCreds credentials in Credo now support the W3c Verifiable Credential format. Using the new ",(0,r.kt)("a",{parentName:"p",href:"https://hyperledger.github.io/aries-rfcs/latest/features/0809-w3c-data-integrity-credential-attachment/"},"Aries RFC 0809: W3C Verifiable Credential Data Integrity Attachment format")," you can issue AnonCreds credentials in W3C VC Data Integrity format, and verify them in W3C VC Data Integrity using ",(0,r.kt)("a",{parentName:"p",href:"https://hyperledger.github.io/aries-rfcs/latest/aip2/0510-dif-pres-exch-attach/"},"Aries RFC 0510: Presentation-Exchange Attachment format"),"."),(0,r.kt)("p",null,"With the change, we've updated the storage of all AnonCreds credentials to be stored as ",(0,r.kt)("inlineCode",{parentName:"p"},"W3cCredentialRecord")," instead of ",(0,r.kt)("inlineCode",{parentName:"p"},"AnonCredsCredentialRecord"),". The ",(0,r.kt)("inlineCode",{parentName:"p"},"AnonCredsCredentialRecord")," is still used for some legacy records which we were not able to migrate to the new format yes (because they rely on resolving objects from the ledger to properly migrate). However in future versions, also these records will be migrated and the ",(0,r.kt)("inlineCode",{parentName:"p"},"AnonCredsCredentialRecord")," will be removed from the codebase."),(0,r.kt)("p",null,"This means some AnonCreds credentials are stored in ",(0,r.kt)("inlineCode",{parentName:"p"},"W3cCredentialRecord")," format, and some in ",(0,r.kt)("inlineCode",{parentName:"p"},"AnonCredsCredentialRecord")," format. Make sure to use the designated methods on the ",(0,r.kt)("inlineCode",{parentName:"p"},"AnonCredsModule")," as well as on the ",(0,r.kt)("inlineCode",{parentName:"p"},"ProofsModule")," to find and query for AnonCreds records, to make sure all record types are returned."),(0,r.kt)("p",null,"See ",(0,r.kt)("a",{parentName:"p",href:"https://github.com/openwallet-foundation/credo-ts/pull/1744"},"Pull Request 1744")," for more information."))}h.isMDXComponent=!0}}]);