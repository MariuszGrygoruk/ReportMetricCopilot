import { defineComponent, computed, withCtx, renderSlot, unref, createVNode, createTextVNode, toDisplayString, ref, shallowRef, toRef, watchEffect, createElementVNode, normalizeStyle, normalizeClass, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrRenderSlot, ssrInterpolate, ssrRenderStyle } from 'vue/server-renderer';
import { _ as _export_sfc, S as useRuntimeConfig, g as genericComponent, e as provideTheme, v as useRtl, x as useToggleScope, p as propsFactory, m as makeThemeProps, D as omit, o as convertToUnit } from './server.mjs';
import { X as getDisplayName } from '../nitro/nitro.mjs';
import { u as useHead } from './v4-CQJEa4-F.mjs';
import { V as VMain, p as createLayout, d as useRender, u as useBackgroundColor, a as useBorder, b as useElevation, c as useRounded, g as useResizeObserver, q as useLayoutItem, r as makeLayoutProps, k as makeComponentProps, m as makeTagProps, i as makeRoundedProps, s as makeLayoutItemProps, j as makeElevationProps, l as makeBorderProps } from './VMain-BTP4CLX1.mjs';
import 'vue-router';
import 'date-holidays';
import 'fs';
import 'path';
import 'crypto';
import 'node:http';
import 'node:https';
import 'node:crypto';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'undici';
import 'pg';
import 'node:url';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';

const makeVAppProps = propsFactory({
  ...makeComponentProps(),
  ...omit(makeLayoutProps(), ["fullHeight"]),
  ...makeThemeProps()
}, "VApp");
const VApp = genericComponent()({
  name: "VApp",
  props: makeVAppProps(),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const theme = provideTheme(props);
    const {
      layoutClasses,
      getLayoutItem,
      items,
      layoutRef
    } = createLayout({
      ...props,
      fullHeight: true
    });
    const {
      rtlClasses
    } = useRtl();
    useRender(() => createElementVNode("div", {
      "ref": layoutRef,
      "class": normalizeClass(["v-application", theme.themeClasses.value, layoutClasses.value, rtlClasses.value, props.class]),
      "style": normalizeStyle([props.style])
    }, [createElementVNode("div", {
      "class": "v-application__wrap"
    }, [slots.default?.()])]));
    return {
      getLayoutItem,
      items,
      theme
    };
  }
});
const makeVFooterProps = propsFactory({
  app: Boolean,
  color: String,
  height: {
    type: [Number, String],
    default: "auto"
  },
  ...makeBorderProps(),
  ...makeComponentProps(),
  ...makeElevationProps(),
  ...makeLayoutItemProps(),
  ...makeRoundedProps(),
  ...makeTagProps({
    tag: "footer"
  }),
  ...makeThemeProps()
}, "VFooter");
const VFooter = genericComponent()({
  name: "VFooter",
  props: makeVFooterProps(),
  setup(props, _ref) {
    let {
      slots
    } = _ref;
    const layoutItemStyles = ref();
    const {
      themeClasses
    } = provideTheme(props);
    const {
      backgroundColorClasses,
      backgroundColorStyles
    } = useBackgroundColor(() => props.color);
    const {
      borderClasses
    } = useBorder(props);
    const {
      elevationClasses
    } = useElevation(props);
    const {
      roundedClasses
    } = useRounded(props);
    const autoHeight = shallowRef(32);
    const {
      resizeRef
    } = useResizeObserver();
    const height = computed(() => props.height === "auto" ? autoHeight.value : parseInt(props.height, 10));
    useToggleScope(() => props.app, () => {
      const layout = useLayoutItem({
        id: props.name,
        order: computed(() => parseInt(props.order, 10)),
        position: toRef(() => "bottom"),
        layoutSize: height,
        elementSize: computed(() => props.height === "auto" ? void 0 : height.value),
        active: toRef(() => props.app),
        absolute: toRef(() => props.absolute)
      });
      watchEffect(() => {
        layoutItemStyles.value = layout.layoutItemStyles.value;
      });
    });
    useRender(() => createVNode(props.tag, {
      "ref": resizeRef,
      "class": normalizeClass(["v-footer", themeClasses.value, backgroundColorClasses.value, borderClasses.value, elevationClasses.value, roundedClasses.value, props.class]),
      "style": normalizeStyle([backgroundColorStyles.value, props.app ? layoutItemStyles.value : {
        height: convertToUnit(props.height)
      }, props.style])
    }, slots));
    return {};
  }
});
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "default",
  __ssrInlineRender: true,
  setup(__props) {
    const config = useRuntimeConfig();
    const version = computed(() => config.public.version);
    const githubInfo = getDisplayName(config.public);
    useHead({
      title: githubInfo,
      meta: [
        { name: "description", content: "Copilot Metrics Dashboard" }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(VApp, _attrs, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(VMain, null, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  ssrRenderSlot(_ctx.$slots, "default", {}, null, _push3, _parent3, _scopeId2);
                } else {
                  return [
                    renderSlot(_ctx.$slots, "default", {}, void 0, true)
                  ];
                }
              }),
              _: 3
            }, _parent2, _scopeId));
            _push2(ssrRenderComponent(VFooter, { class: "bg-indigo-lighten-1 text-center d-flex flex-column fixed-footer" }, {
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(`<div class="px-4 py-2 text-center w-100" data-v-e4f2f01a${_scopeId2}>${ssrInterpolate((/* @__PURE__ */ new Date()).getFullYear())} — <strong data-v-e4f2f01a${_scopeId2}><a href="https://github.com/github-copilot-resources/copilot-metrics-viewer" target="_blank" rel="noopener noreferrer" style="${ssrRenderStyle({ "color": "inherit" })}" data-v-e4f2f01a${_scopeId2}>Copilot Metrics Viewer</a></strong> — ${ssrInterpolate(unref(version))}</div>`);
                } else {
                  return [
                    createVNode("div", { class: "px-4 py-2 text-center w-100" }, [
                      createTextVNode(toDisplayString((/* @__PURE__ */ new Date()).getFullYear()) + " — ", 1),
                      createVNode("strong", null, [
                        createVNode("a", {
                          href: "https://github.com/github-copilot-resources/copilot-metrics-viewer",
                          target: "_blank",
                          rel: "noopener noreferrer",
                          style: { "color": "inherit" }
                        }, "Copilot Metrics Viewer")
                      ]),
                      createTextVNode(" — " + toDisplayString(unref(version)), 1)
                    ])
                  ];
                }
              }),
              _: 1
            }, _parent2, _scopeId));
          } else {
            return [
              createVNode(VMain, null, {
                default: withCtx(() => [
                  renderSlot(_ctx.$slots, "default", {}, void 0, true)
                ]),
                _: 3
              }),
              createVNode(VFooter, { class: "bg-indigo-lighten-1 text-center d-flex flex-column fixed-footer" }, {
                default: withCtx(() => [
                  createVNode("div", { class: "px-4 py-2 text-center w-100" }, [
                    createTextVNode(toDisplayString((/* @__PURE__ */ new Date()).getFullYear()) + " — ", 1),
                    createVNode("strong", null, [
                      createVNode("a", {
                        href: "https://github.com/github-copilot-resources/copilot-metrics-viewer",
                        target: "_blank",
                        rel: "noopener noreferrer",
                        style: { "color": "inherit" }
                      }, "Copilot Metrics Viewer")
                    ]),
                    createTextVNode(" — " + toDisplayString(unref(version)), 1)
                  ])
                ]),
                _: 1
              })
            ];
          }
        }),
        _: 3
      }, _parent));
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _default = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-e4f2f01a"]]);

export { _default as default };
//# sourceMappingURL=default-Co4BAkwJ.mjs.map
