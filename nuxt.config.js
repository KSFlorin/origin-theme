import swell from 'swell-js';
import settings from './config/settings.json';
import menus from './config/menus.json';
import { getGoogleFontConfig } from './modules/swell-editor/utils';
import { getLangSettings } from './modules/swell/lang/utils';
import { mergeSettings } from './modules/swell/utils/mergeSettings';
import getRoutes from './modules/swell/utils/getRoutes';

const isProduction = process.env.NODE_ENV === 'production';
const editorMode = process.env.SWELL_EDITOR === 'true';
const storeId = process.env.SWELL_STORE_ID || settings.store.id;
const publicKey = process.env.SWELL_PUBLIC_KEY || settings.store.public_key;
const storeUrl = process.env.SWELL_STORE_URL || settings.store.url;

export default async () => {
  swell.init(storeId, publicKey, {
    useCamelCase: true,
    url: storeUrl,
    previewContent: editorMode || !isProduction,
  });

  await swell.settings.load();

  swell.settings.set({
    value: mergeSettings(await swell.settings.get(), settings),
  });

  swell.settings.set({
    model: 'menus',
    value: mergeSettings(
      swell.settings.getState('/settings/menus', 'menuState'),
      menus,
    ),
  });

  const currentSettings = await swell.settings.get();
  const loadingColor = await swell.settings.get('colors.accent');
  const gtmId = await swell.settings.get('analytics.gtmId');
  const storeName = await swell.settings.get('store.name');
  const i18n = await getLangSettings(swell);

  return {
    target: editorMode ? 'server' : 'static',
    build: {
      analyze: !isProduction,
    },
    vue: {
      config: {
        devtools: !isProduction,
        productionTip: false,
      },
    },

    /*
     ** Make all components in the /components folder available in templates without
     *  needing to import them explicitly or define them on the Vue instance object.
     */
    components: true,

    /*
     ** Set the progress-bar color
     */
    loading: {
      color: loadingColor,
      continuous: true,
    },

    /*
     ** Vue plugins to load before mounting the App
     */
    plugins: [
      { src: '~/plugins/global-scripts', mode: 'client' },
      { src: '~/plugins/vue-credit-card-validation', mode: 'client' },
      { src: '~/plugins/directives', mode: 'client' },
      { src: '~/plugins/swell-lang.js' },
    ],


    script: [{
      hid: 'Rudder-JS',
      src: 'http://cdn.rudderlabs.com/v1.1/rudder-analytics.min.js',
      defer: true
    },
    {
      hid: 'rudder-js',
      innerHTML: `
          rudderanalytics = window.rudderanalytics = [];
          var  methods = [
              'load',
              'page',
              'track',
              'identify',
              'alias',
              'group',
              'ready',
              'reset',
              'getAnonymousId',
              'setAnonymousId'
          ];
          for (var i = 0; i < methods.length; i++) {
                var method = methods[i];
                rudderanalytics[method] = function (methodName) {
                      return function () {
                                         rudderanalytics.push([methodName].concat(Array.prototype.slice.call(arguments)));
                      };
                    }(method);
          }
          rudderanalytics.load("27frvOmujG9Q7Ge1qNDcmsKCtOA", " https://florinsteybg.dataplane.rudderstack.com");
          rudderanalytics.ready(()=>{
            console.log("We are all set");
          });
          //rudderanalytics.page();
          `,
      type: 'text/javascript',
      charset: 'utf-8'
    }
  ],














    /*
     ** Nuxt.js modules
     */
    modules: [
      ['@nuxtjs/gtm'],

      // [
      //   '@nuxtjs/sentry',
      //   /*
      //    ** Logs app errors with Sentry's browser and node SDKs.
      //    *
      //    *  You can use environment variables or the object below to set config options.
      //    *  See https://github.com/nuxt-community/sentry-module for all available
      //    *  options, defaults, and environment variables.
      //    */
      //   {
      //     // dsn: '', // or SENTRY_DSN in .env
      //     // config: {}
      //   },
      // ],

      /*
       ** Generates a sitemap.xml
       *
       *  Automatically generate or serve dynamic sitemap.xml for Nuxt projects!
       *  See https://github.com/nuxt-community/sentry-module for all available
       *  options, defaults, and environment variables.
       */
      '@nuxtjs/sitemap',
    ],








    buildModules: [
      // https://go.nuxtjs.dev/eslint
      '@nuxtjs/eslint-module',
      // https://go.nuxtjs.dev/stylelint
      '@nuxtjs/stylelint-module',
      [
        /*
         ** Generate dynamic routes for @nuxtjs/sitemap
         *
         */
        '~/modules/swell/utils/generateDynamicRoutes',
      ],

      [
        // https://go.nuxtjs.dev/tailwindcss
        '@nuxtjs/tailwindcss',
        /*
         ** Adds TailwindCSS (including PurgeCSS)
         *
         *  See https://tailwindcss.nuxtjs.org/ for config options.
         */
        {
          // Put your config overrides here
        },
      ],

      [
        '@nuxtjs/google-fonts',
        /*
         ** Parses Google Font families and loads them via stylesheet.
         *
         *  The config object is generated by the swell-editor module.
         *  See https://github.com/nuxt-community/google-fonts-module if you want
         *  to eject or provide your own config options.
         */
        getGoogleFontConfig(currentSettings),
      ],

      [
        '~/modules/swell-editor',
        /*
         ** Provides communication and utilitiy functions for interfacing
         *  with Swell's storefront editor and fetching settings/content.
         */
        {
          useEditorSettings: editorMode,
          settings: currentSettings,
        },
      ],

      [
        '~/modules/swell',
        /*
         ** Initializes Swell.js SDK and injects it into Nuxt's context.
         */
        {
          storeId,
          publicKey,
          storeUrl,
          previewContent: editorMode || !isProduction,
          settings: currentSettings,
        },
      ],

      ['@nuxtjs/i18n'],

      [
        '@nuxtjs/pwa',
        /*
         ** Provides PWA (Progressive Web App) functionality including app icons,
         *  SEO metadata, manifest.json file, and offline caching.
         *
         *  Use the object below to set config options.
         *  See https://pwa.nuxtjs.org/ for all available options and defaults.
         */
      ],
    ],

    gtm: {
      id: gtmId,
      enabled: !!gtmId && isProduction,
    },

    pwa: {
      manifest: false,
      meta: {
        name: storeName,
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern:
              `${process.env.CDN_HOST}/*` || 'https://cdn.schema.io/*',
          },
        ],
      },
    },

    i18n,

    sitemap: {
      hostname: storeUrl,
      gzip: true,
      i18n: true,
      exclude: ['/account/**', '/*/account/**'],
    },

    generate: {
      exclude: [/^\/?([a-z]{2}-?[A-Z]{2}?)?\/account/],
      fallback: true, // Fallback to the generated 404.html,
      concurrency: 1,
      interval: 25,
      crawler: false,
      routes: () => getRoutes(swell),
    },

    /*
     ** Extend default Nuxt routes to add page aliases
     */
    router: {
      trailingSlash: true,
      extendRoutes(routes, resolve) {
        // Rewrite to use the pages/_slug.vue component for home page, since the
        // content type is the same. If you want to have a unique template,
        // create a pages/index.vue and remove this route definition.
        routes.push({
          name: 'index',
          path: '/',
          component: resolve(__dirname, 'pages/_slug.vue'),
        });
      },
    },

    /*
     ** Extend default Nuxt server options
     */
    server: {
      host: process.env.HOST || 'localhost',
      port: process.env.PORT || 3333,
    },

    env: {
      cdnHost: process.env.CDN_HOST || 'https://cdn.schema.io',
    },
  };
};
