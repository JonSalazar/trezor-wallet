/* @flow */
'use strict';

import * as ACCOUNT from './constants/account';

import { initialState } from '../reducers/SelectedAccountReducer';

import type { AsyncAction, ThunkAction, Action, GetState, Dispatch, TrezorDevice } from '~/flowtype';
import type { State } from '../reducers/SelectedAccountReducer';
import type { Coin } from '../reducers/LocalStorageReducer';

export type SelectedAccountAction = {
    type: typeof ACCOUNT.INIT,
    state: State
} | {
    type: typeof ACCOUNT.DISPOSE,
};

export const init = (): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {

        const { location } = getState().router;
        const urlParams = location.state;

        const selected: ?TrezorDevice = getState().wallet.selectedDevice;;
        if (!selected) return;
        if (!selected.state || !selected.features) return;

        const { config } = getState().localStorage;
        const coin: ?Coin = config.coins.find(c => c.network === urlParams.network);
        if (!coin) return;

        const state: State = {
            index: parseInt(urlParams.account),
            deviceState: selected.state || '0',
            deviceId: selected.features ? selected.features.device_id : '0',
            deviceInstance: selected.instance,
            network: urlParams.network,
            coin,
            location: location.pathname,
        };

        dispatch({
            type: ACCOUNT.INIT,
            state: state
        });

    }
}

export const update = (initAccountAction: () => ThunkAction): ThunkAction => {
    return (dispatch: Dispatch, getState: GetState): void => {
        const {
            selectedAccount,
            router
        } = getState();

        const shouldReload: boolean = (!selectedAccount || router.location.pathname !== selectedAccount.location);
        if (shouldReload) {
            dispatch( dispose() );
            dispatch( init() );
            if (selectedAccount !== null)
                initAccountAction();
        }
    }
}

export const dispose = (): Action => {
    return {
        type: ACCOUNT.DISPOSE
    }
}

export default {
    init,
    update,
    dispose
}