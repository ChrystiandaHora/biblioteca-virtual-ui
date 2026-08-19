import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import vueA11y from 'eslint-plugin-vuejs-accessibility'

export default [
  {
    ignores: ['dist/**', 'node_modules/**'],
  },

  js.configs.recommended,
  ...vue.configs['flat/recommended'],
  ...vueA11y.configs['flat/recommended'],

  {
    files: ['**/*.{js,mjs,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Navegador
        document: 'readonly',
        window: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        AbortController: 'readonly',
        URLSearchParams: 'readonly',
        HTMLElement: 'readonly',
        console: 'readonly',
        // Node (scripts)
        process: 'readonly',
      },
    },
    rules: {
      /* ------------------------------------------------------------------
         Regras de acessibilidade.

         O preset padrão do plugin deixa desligadas justamente as regras que
         pegam os erros mais caros, então elas são reativadas aqui como erro.
         ------------------------------------------------------------------ */

      // Nome acessível precisa conter o texto visível, na mesma ordem — sem
      // isso, controle por voz não alcança o botão (SC 2.5.3).
      'vuejs-accessibility/label-has-for': [
        'error',
        { required: { some: ['nesting', 'id'] }, allowChildren: false },
      ],
      // `div`/`span` clicável é o anti-padrão número um.
      'vuejs-accessibility/click-events-have-key-events': 'error',
      'vuejs-accessibility/no-static-element-interactions': 'error',
      'vuejs-accessibility/interactive-supports-focus': 'error',
      // ARIA apontando para id inexistente, ou role/atributo inválido.
      'vuejs-accessibility/aria-props': 'error',
      'vuejs-accessibility/aria-role': 'error',
      'vuejs-accessibility/aria-unsupported-elements': 'error',
      'vuejs-accessibility/role-has-required-aria-props': 'error',
      // Toda <img> precisa de alt (vazio é decisão consciente, não omissão).
      'vuejs-accessibility/alt-text': 'error',
      'vuejs-accessibility/anchor-has-content': 'error',
      'vuejs-accessibility/heading-has-content': 'error',
      'vuejs-accessibility/form-control-has-label': 'error',
      'vuejs-accessibility/iframe-has-title': 'error',
      'vuejs-accessibility/no-autofocus': 'error',
      'vuejs-accessibility/no-redundant-roles': 'error',
      'vuejs-accessibility/tabindex-no-positive': 'error',
      'vuejs-accessibility/mouse-events-have-key-events': 'error',
      // Elemento focável escondido de leitor de tela é foco fantasma: a pessoa
      // chega nele com Tab e não ouve nada.
      'vuejs-accessibility/no-aria-hidden-on-focusable': 'error',
      'vuejs-accessibility/no-role-presentation-on-focusable': 'error',
      'vuejs-accessibility/no-access-key': 'error',
      'vuejs-accessibility/no-distracting-elements': 'error',
      'vuejs-accessibility/media-has-caption': 'error',
      // `@change` em <select> é justamente o evento correto para o elemento
      // nativo; a regra existe para outros casos e não se aplica aqui.
      'vuejs-accessibility/no-onchange': 'off',

      /* ------------------------------ Vue ------------------------------- */
      'vue/multi-word-component-names': 'error',
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/define-props-declaration': ['error', 'runtime'],
      'vue/no-unused-refs': 'error',
      'vue/prefer-true-attribute-shorthand': 'warn',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',
      'vue/html-self-closing': 'off',
      'vue/html-indent': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/attributes-order': 'off',

      /* --------------------------- JavaScript ---------------------------- */
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'error',
    },
  },

  {
    // Os scripts de verificação rodam no Node e imprimem relatório no stdout.
    files: ['scripts/**/*.mjs'],
    rules: { 'no-console': 'off' },
  },
]
