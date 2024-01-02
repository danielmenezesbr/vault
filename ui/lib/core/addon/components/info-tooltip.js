/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@ember/component';
import layout from '../templates/components/info-tooltip';

export default Component.extend({
  layout,
  'data-test-component': 'info-tooltip',
  attributeBindings: ['data-test-component'],
  tagName: 'span',
  classNames: ['is-inline-block'],

  actions: {
    preventSubmit(e) {
      e.preventDefault();
    },
  },
});
