import antfu from "@antfu/eslint-config";

export default antfu({
  stylistic: {
    indent: 2,
    quotes: "double",
    semi: true,
    overrides: {
      "style/brace-style": ["error", "1tbs", { allowSingleLine: false }],
      "style/jsx-curly-brace-presence": [
        "error",
        {
          props: "never",
          children: "never",
          propElementValues: "always",
        },
      ],
      "style/template-curly-spacing": ["error", "never"],
      "style/padding-line-between-statements": [
        "error",
        {
          blankLine: "always",
          prev: "*",
          next: ["return", "function"],
        },
        {
          blankLine: "always",
          prev: "*",
          next: ["enum", "interface", "type"],
        },
        {
          blankLine: "never",
          prev: "function-overload",
          next: "function",
        },
      ],
    },
  },
  react: {
    overrides: {
      "react/prop-types": "off",
    },
  },
  unicorn: true,
  typescript: {
    overrides: {
      "ts/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "lodash",
              message: "Please use lodash-es instead.",
            },
          ],
          patterns: ["lodash-es/*"],
        },
      ],
      "ts/no-redeclare": "off",
      "ts/no-namespace": ["error", { allowDeclarations: true }],
      "ts/no-misused-promises": [
        "error",
        {
          checksVoidReturn: false,
        },
      ],
      "ts/no-floating-promises": "error",
    },
    parserOptions: {
      project: "./tsconfig.json",
    },
  },

  formatters: {
    css: true,
    html: true,
    markdown: "prettier",
  },
  rules: {
    "antfu/if-newline": "off",
  },
})
  .overrides({
    "antfu/jsdoc/rules": {
      rules: {
        "jsdoc/check-param-names": "off",
      },
    },

    "antfu/react/rules": {
      ignores: ["test/**"],
    },

    "antfu/node/rules": {
      rules: {
        "node/prefer-global/process": ["error", "always"],
        "node/prefer-global/buffer": ["error", "always"],
      },
    },

    "antfu/unicorn/rules": {
      rules: {
        "unicorn/import-style": [
          "error",
          {
            styles: {
              "react": {
                named: true,
                namespace: true,
              },
              "zod": {
                named: true,
              },
              "lodash-es": {
                named: true,
              },
              "date-fns": {
                named: true,
              },
              "valibot": {
                namespace: true,
              },
            },
          },
        ],
      },
    },

    "antfu/perfectionist/setup": {
      rules: {
        "perfectionist/sort-jsx-props": [
          "error",
          {
            type: "natural",
            order: "asc",
            ignoreCase: true,
            ignorePattern: [],
            groups: [],
            customGroups: {},
          },
        ],
        "perfectionist/sort-imports": [
          "error",
          {
            groups: [
              "side-effect",
              "type",
              ["builtin-type", "external-type"],
              ["builtin", "external"],
              "internal-type",
              "internal",
              ["parent-type", "sibling-type", "index-type"],
              ["parent", "sibling", "index"],
              "object",
              "unknown",
            ],
            newlinesBetween: "always",
            order: "asc",
            type: "natural",
            ignoreCase: false,
            sortSideEffects: true,
            internalPattern: ["^@/.*"],
          },
        ],
      },
    },

    "antfu/no-top-level-await": {
      ignores: ["./src/main/**"],
    }
  })
  .renamePlugins({});
