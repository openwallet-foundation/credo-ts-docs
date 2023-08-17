"use strict";(self.webpackChunkmy_website=self.webpackChunkmy_website||[]).push([[1271],{3905:(e,t,n)=>{n.d(t,{Zo:()=>c,kt:()=>f});var a=n(7294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function s(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?o(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},o=Object.keys(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(a=0;a<o.length;a++)n=o[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var i=a.createContext({}),u=function(e){var t=a.useContext(i),n=t;return e&&(n="function"==typeof e?e(t):s(s({},t),e)),n},c=function(e){var t=u(e.components);return a.createElement(i.Provider,{value:t},e.children)},p="mdxType",d={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},m=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,o=e.originalType,i=e.parentName,c=l(e,["components","mdxType","originalType","parentName"]),p=u(n),m=r,f=p["".concat(i,".").concat(m)]||p[m]||d[m]||o;return n?a.createElement(f,s(s({ref:t},c),{},{components:n})):a.createElement(f,s({ref:t},c))}));function f(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var o=n.length,s=new Array(o);s[0]=m;var l={};for(var i in t)hasOwnProperty.call(t,i)&&(l[i]=t[i]);l.originalType=e,l[p]="string"==typeof e?e:r,s[1]=l;for(var u=2;u<o;u++)s[u]=n[u];return a.createElement.apply(null,s)}return a.createElement.apply(null,n)}m.displayName="MDXCreateElement"},5162:(e,t,n)=>{n.d(t,{Z:()=>s});var a=n(7294),r=n(6010);const o={tabItem:"tabItem_Ymn6"};function s(e){let{children:t,hidden:n,className:s}=e;return a.createElement("div",{role:"tabpanel",className:(0,r.Z)(o.tabItem,s),hidden:n},t)}},4866:(e,t,n)=>{n.d(t,{Z:()=>w});var a=n(7462),r=n(7294),o=n(6010),s=n(2466),l=n(6550),i=n(1980),u=n(7392),c=n(12);function p(e){return function(e){return r.Children.map(e,(e=>{if((0,r.isValidElement)(e)&&"value"in e.props)return e;throw new Error(`Docusaurus error: Bad <Tabs> child <${"string"==typeof e.type?e.type:e.type.name}>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.`)}))}(e).map((e=>{let{props:{value:t,label:n,attributes:a,default:r}}=e;return{value:t,label:n,attributes:a,default:r}}))}function d(e){const{values:t,children:n}=e;return(0,r.useMemo)((()=>{const e=t??p(n);return function(e){const t=(0,u.l)(e,((e,t)=>e.value===t.value));if(t.length>0)throw new Error(`Docusaurus error: Duplicate values "${t.map((e=>e.value)).join(", ")}" found in <Tabs>. Every value needs to be unique.`)}(e),e}),[t,n])}function m(e){let{value:t,tabValues:n}=e;return n.some((e=>e.value===t))}function f(e){let{queryString:t=!1,groupId:n}=e;const a=(0,l.k6)(),o=function(e){let{queryString:t=!1,groupId:n}=e;if("string"==typeof t)return t;if(!1===t)return null;if(!0===t&&!n)throw new Error('Docusaurus error: The <Tabs> component groupId prop is required if queryString=true, because this value is used as the search param name. You can also provide an explicit value such as queryString="my-search-param".');return n??null}({queryString:t,groupId:n});return[(0,i._X)(o),(0,r.useCallback)((e=>{if(!o)return;const t=new URLSearchParams(a.location.search);t.set(o,e),a.replace({...a.location,search:t.toString()})}),[o,a])]}function h(e){const{defaultValue:t,queryString:n=!1,groupId:a}=e,o=d(e),[s,l]=(0,r.useState)((()=>function(e){let{defaultValue:t,tabValues:n}=e;if(0===n.length)throw new Error("Docusaurus error: the <Tabs> component requires at least one <TabItem> children component");if(t){if(!m({value:t,tabValues:n}))throw new Error(`Docusaurus error: The <Tabs> has a defaultValue "${t}" but none of its children has the corresponding value. Available values are: ${n.map((e=>e.value)).join(", ")}. If you intend to show no default tab, use defaultValue={null} instead.`);return t}const a=n.find((e=>e.default))??n[0];if(!a)throw new Error("Unexpected error: 0 tabValues");return a.value}({defaultValue:t,tabValues:o}))),[i,u]=f({queryString:n,groupId:a}),[p,h]=function(e){let{groupId:t}=e;const n=function(e){return e?`docusaurus.tab.${e}`:null}(t),[a,o]=(0,c.Nk)(n);return[a,(0,r.useCallback)((e=>{n&&o.set(e)}),[n,o])]}({groupId:a}),k=(()=>{const e=i??p;return m({value:e,tabValues:o})?e:null})();(0,r.useLayoutEffect)((()=>{k&&l(k)}),[k]);return{selectedValue:s,selectValue:(0,r.useCallback)((e=>{if(!m({value:e,tabValues:o}))throw new Error(`Can't select invalid tab value=${e}`);l(e),u(e),h(e)}),[u,h,o]),tabValues:o}}var k=n(2389);const g={tabList:"tabList__CuJ",tabItem:"tabItem_LNqP"};function y(e){let{className:t,block:n,selectedValue:l,selectValue:i,tabValues:u}=e;const c=[],{blockElementScrollPositionUntilNextRender:p}=(0,s.o5)(),d=e=>{const t=e.currentTarget,n=c.indexOf(t),a=u[n].value;a!==l&&(p(t),i(a))},m=e=>{let t=null;switch(e.key){case"Enter":d(e);break;case"ArrowRight":{const n=c.indexOf(e.currentTarget)+1;t=c[n]??c[0];break}case"ArrowLeft":{const n=c.indexOf(e.currentTarget)-1;t=c[n]??c[c.length-1];break}}t?.focus()};return r.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,o.Z)("tabs",{"tabs--block":n},t)},u.map((e=>{let{value:t,label:n,attributes:s}=e;return r.createElement("li",(0,a.Z)({role:"tab",tabIndex:l===t?0:-1,"aria-selected":l===t,key:t,ref:e=>c.push(e),onKeyDown:m,onClick:d},s,{className:(0,o.Z)("tabs__item",g.tabItem,s?.className,{"tabs__item--active":l===t})}),n??t)})))}function b(e){let{lazy:t,children:n,selectedValue:a}=e;if(n=Array.isArray(n)?n:[n],t){const e=n.find((e=>e.props.value===a));return e?(0,r.cloneElement)(e,{className:"margin-top--md"}):null}return r.createElement("div",{className:"margin-top--md"},n.map(((e,t)=>(0,r.cloneElement)(e,{key:t,hidden:e.props.value!==a}))))}function v(e){const t=h(e);return r.createElement("div",{className:(0,o.Z)("tabs-container",g.tabList)},r.createElement(y,(0,a.Z)({},e,t)),r.createElement(b,(0,a.Z)({},e,t)))}function w(e){const t=(0,k.Z)();return r.createElement(v,(0,a.Z)({key:String(t)},e))}},1752:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>c,contentTitle:()=>i,default:()=>f,frontMatter:()=>l,metadata:()=>u,toc:()=>p});var a=n(7462),r=(n(7294),n(3905)),o=n(4866),s=n(5162);const l={},i="React Hooks",u={unversionedId:"extensions/react-hooks",id:"extensions/react-hooks",title:"React Hooks",description:"The React Hooks package exposes useful React hooks that allow you to easily interact with AFJ from a React client application.",source:"@site/guides/extensions/react-hooks.md",sourceDirName:"extensions",slug:"/extensions/react-hooks",permalink:"/guides/0.4/extensions/react-hooks",draft:!1,tags:[],version:"current",frontMatter:{},sidebar:"tutorialSidebar",previous:{title:"REST API",permalink:"/guides/0.4/extensions/rest"},next:{title:"Redux Store",permalink:"/guides/0.4/extensions/redux-store"}},c={},p=[{value:"Installation",id:"installation",level:2},{value:"npm",id:"npm",level:2},{value:"Yarn",id:"yarn",level:2},{value:"Usage",id:"usage",level:2}],d={toc:p},m="wrapper";function f(e){let{components:t,...n}=e;return(0,r.kt)(m,(0,a.Z)({},d,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("h1",{id:"react-hooks"},"React Hooks"),(0,r.kt)("p",null,"The React Hooks package exposes useful React hooks that allow you to easily interact with AFJ from a React client application."),(0,r.kt)("p",null,"These hooks provide a simple way to query agent data in a client application, allowing you to focus on the user interface."),(0,r.kt)("admonition",{type:"note"},(0,r.kt)("p",{parentName:"admonition"},"This document is for version ",(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"0.5.x"))," of the ",(0,r.kt)("inlineCode",{parentName:"p"},"@aries-framework/react-hooks")," package, that works with ",(0,r.kt)("inlineCode",{parentName:"p"},"@aries-framework/core")," version ",(0,r.kt)("strong",{parentName:"p"},(0,r.kt)("inlineCode",{parentName:"strong"},"0.4.x")),". Extension packages (such as React Hooks) are versioned separately from the core packages.")),(0,r.kt)("h2",{id:"installation"},"Installation"),(0,r.kt)("p",null,"To add the React Hooks package to your existing project simply run:"),(0,r.kt)(o.Z,{mdxType:"Tabs"},(0,r.kt)(s.Z,{label:"npm",value:"tab1",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-sh"},"npm i @aries-framework/react-hooks@^0.5\n"))),(0,r.kt)(s.Z,{label:"Yarn",value:"tab2",mdxType:"TabItem"},(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-sh"},"yarn add @aries-framework/react-hooks@^0.5\n")))),(0,r.kt)("h2",{id:"usage"},"Usage"),(0,r.kt)("p",null,"This package exposes useful React hooks that allow you to easily interact with AFJ."),(0,r.kt)("p",null,"Everything exported from Hooks:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"import AgentProvider, {\n  useAgent,\n  useConnections,\n  useConnectionById,\n  useCredentials,\n  useCredentialById,\n  useCredentialByState,\n  useProofs,\n  useProofById,\n  useProofByState,\n} from '@aries-framework/react-hooks'\n")),(0,r.kt)("p",null,"First step is to wrap your entire app in our ",(0,r.kt)("inlineCode",{parentName:"p"},"<AgentProvider/>"),". The provider takes an initialized agent. The base of your app should look something like this:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-tsx"},"import AgentProvider from '@aries-framework/react-hooks'\n\nconst App = () => {\n  const [agent, setAgent] = useState(undefined)\n\n  const initializeAgent = async () => {\n    const appAgent = new Agent({\n      /* agent options */\n    })\n    await appAgent.initialize()\n    setAgent(appAgent)\n  }\n\n  useEffect(() => {\n    initializeAgent()\n  }, [])\n\n  if (!agent) return <LoadingComponent />\n\n  return <AgentProvider agent={agent}>/* Your app here */</AgentProvider>\n}\n")),(0,r.kt)("p",null,"And that's it! Your app should be set up to receive all the necessary data your app will need! Now let's see how we actually get that data to our components."),(0,r.kt)("p",null,"The ",(0,r.kt)("inlineCode",{parentName:"p"},"useAgent")," hook returns ",(0,r.kt)("inlineCode",{parentName:"p"},"{ agent, loading }")," so anytime you need access to any of the methods tied to the agent, you can ",(0,r.kt)("inlineCode",{parentName:"p"},"useAgent()")," anywhere."),(0,r.kt)("p",null,"The following is an example of how you could use the ",(0,r.kt)("inlineCode",{parentName:"p"},"useConnections")," hook to render a full list of all a user's connections."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"import { useConnections } from '@aries-framework/react-hooks'\n\nconst MyConnectionsComponent = () => {\n  // all base hooks return an array of objects and a loading boolean\n  const { connections, loading } = useConnections()\n\n  return <FlatList data={connections} renderItem={({ item }) => <MyListItem connection={item} />} />\n}\n")),(0,r.kt)("p",null,"The three base hooks: ",(0,r.kt)("inlineCode",{parentName:"p"},"useConnections"),", ",(0,r.kt)("inlineCode",{parentName:"p"},"useCredentials"),", and ",(0,r.kt)("inlineCode",{parentName:"p"},"useProofs")," work just like the above! Just call the hook, destructure the data, and pass it through!"),(0,r.kt)("p",null,"Each base hook has a ",(0,r.kt)("inlineCode",{parentName:"p"},"ById")," version that returns a singular record. For example if I wanted only a specific connectionRecord, I'd do this."),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"const connection = useConnectionById(id)\n")),(0,r.kt)("p",null,"More commonly, you'll want to get a filtered list of records based off of their state. Well, Hooray! We have a ",(0,r.kt)("inlineCode",{parentName:"p"},"ByState")," version as well. For example, you can do this:"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre",className:"language-ts"},"const credentials = useCredentialByState(CredentialState.OfferReceived)\n")))}f.isMDXComponent=!0}}]);