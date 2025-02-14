/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: BUSL-1.1
 */

import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { service } from '@ember/service';
import { task } from 'ember-concurrency';
import { waitFor } from '@ember/test-waiters';
import { action } from '@ember/object';
import errorMessage from 'vault/utils/error-message';
import Ember from 'ember';

import type FlashMessageService from 'vault/services/flash-messages';
import type StoreService from 'vault/services/store';
import type RouterService from '@ember/routing/router-service';
import type VersionService from 'vault/services/version';
import type { SyncDestinationAssociationMetrics } from 'vault/vault/adapters/sync/association';
import type SyncDestinationModel from 'vault/vault/models/sync/destination';
import type { HTMLElementEvent } from 'vault/forms';

interface Args {
  destinations: Array<SyncDestinationModel>;
  totalVaultSecrets: number;
  activatedFeatures: Array<string>;
  isAdapterError: boolean;
}

export default class SyncSecretsDestinationsPageComponent extends Component<Args> {
  @service declare readonly flashMessages: FlashMessageService;
  @service declare readonly store: StoreService;
  @service declare readonly router: RouterService;
  @service declare readonly version: VersionService;

  @tracked destinationMetrics: SyncDestinationAssociationMetrics[] = [];
  @tracked page = 1;
  @tracked showActivateSecretsSyncModal = false;
  @tracked confirmDisabled = true;

  pageSize = Ember.testing ? 3 : 5; // lower in tests to test pagination without seeding more data

  constructor(owner: unknown, args: Args) {
    super(owner, args);
    if (this.args.destinations.length) {
      this.fetchAssociationsForDestinations.perform();
    }
  }

  get isActivated() {
    if (this.args.isAdapterError) {
      return false;
    }
    return this.args.activatedFeatures.includes('secrets-sync');
  }

  fetchAssociationsForDestinations = task(this, {}, async (page = 1) => {
    try {
      const total = page * this.pageSize;
      const paginatedDestinations = this.args.destinations.slice(total - this.pageSize, total);
      this.destinationMetrics = await this.store
        .adapterFor('sync/association')
        .fetchByDestinations(paginatedDestinations);
      this.page = page;
    } catch (error) {
      this.destinationMetrics = [];
    }
  });

  @action
  onDocsConfirmChange(event: HTMLElementEvent<HTMLInputElement>) {
    this.confirmDisabled = !event.target.checked;
  }

  @task
  @waitFor
  *onFeatureConfirm() {
    try {
      yield this.store
        .adapterFor('application')
        .ajax('/v1/sys/activation-flags/secrets-sync/activate', 'POST');
      this.router.transitionTo('vault.cluster.sync.secrets.overview');
    } catch (error) {
      this.flashMessages.danger(`Error enabling feature \n ${errorMessage(error)}`);
    } finally {
      this.showActivateSecretsSyncModal = false;
    }
  }
}
