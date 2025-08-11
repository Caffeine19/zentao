// import the original type declarations
import "i18next";
// import all namespaces (for the default language, only)
import zhCN from "../i18n/locales/zh-CN.json";
import enUS from "../i18n/locales/en-US.json";

declare module "i18next" {
  // Extend CustomTypeOptions
  interface CustomTypeOptions {
    // custom namespace type, if you changed it
    defaultNS: Preferences["language"];
    // custom resources type
    resources: {
      "zh-CN": typeof zhCN;
      "en-US": typeof enUS;
    };
  }
}
