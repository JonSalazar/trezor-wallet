/* @flow */


import { LOCATION_CHANGE } from 'react-router-redux';
import * as ACCOUNT from 'actions/constants/account';
import * as SEND from 'actions/constants/send';
import * as NOTIFICATION from 'actions/constants/notification';
import * as PENDING from 'actions/constants/pendingTx';

import * as SendFormActions from 'actions/SendFormActions';
import * as SessionStorageActions from 'actions/SessionStorageActions';

import * as stateUtils from 'reducers/utils';

import type {
    AsyncAction,
    Action,
    GetState,
    Dispatch,
    State,
} from 'flowtype';

export type SelectedAccountAction = {
    type: typeof ACCOUNT.DISPOSE,
} | {
    type: typeof ACCOUNT.UPDATE_SELECTED_ACCOUNT,
    payload: $ElementType<State, 'selectedAccount'>
};

export const dispose = (): Action => ({
    type: ACCOUNT.DISPOSE,
});

export const updateSelectedValues = (prevState: State, action: Action): AsyncAction => async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const locationChange: boolean = action.type === LOCATION_CHANGE;
    const state: State = getState();
    const { location } = state.router;

    // reset form to default
    if (action.type === SEND.TX_COMPLETE) {
        // dispatch( SendFormActions.init() );
        // linear action
        // SessionStorageActions.clear(location.pathname);
    }

    if (prevState.sendForm !== state.sendForm) {
        dispatch(SessionStorageActions.save());
    }

    // handle devices state change (from trezor-connect events or location change)
    if (locationChange
            || prevState.accounts !== state.accounts
            || prevState.discovery !== state.discovery
            || prevState.tokens !== state.tokens
            || prevState.pending !== state.pending) {
        const account = stateUtils.getSelectedAccount(state);
        const network = stateUtils.getSelectedNetwork(state);
        const discovery = stateUtils.getDiscoveryProcess(state);
        const tokens = stateUtils.getAccountTokens(state, account);
        const pending = stateUtils.getAccountPendingTx(state.pending, account);

        const payload: $ElementType<State, 'selectedAccount'> = {
            location: location.pathname,
            account,
            network,
            discovery,
            tokens,
            pending,
        };

        let needUpdate: boolean = false;
        Object.keys(payload).forEach((key) => {
            if (Array.isArray(payload[key])) {
                if (Array.isArray(state.selectedAccount[key]) && payload[key].length !== state.selectedAccount[key].length) {
                    needUpdate = true;
                }
            } else if (payload[key] !== state.selectedAccount[key]) {
                needUpdate = true;
            }
        });

        if (needUpdate) {
            dispatch({
                type: ACCOUNT.UPDATE_SELECTED_ACCOUNT,
                payload,
            });

            // initialize SendFormReducer
            if (location.state.send && getState().sendForm.currency === '') {
                dispatch(SendFormActions.init());
            }

            if (location.state.send) {
                const rejectedTxs = pending.filter(tx => tx.rejected);
                rejectedTxs.forEach((tx) => {
                    dispatch({
                        type: NOTIFICATION.ADD,
                        payload: {
                            type: 'warning',
                            title: 'Pending transaction rejected',
                            message: `Transaction with id: ${tx.id} not found.`,
                            cancelable: true,
                            actions: [
                                {
                                    label: 'OK',
                                    callback: () => {
                                        dispatch({
                                            type: PENDING.TX_RESOLVED,
                                            tx,
                                        });
                                    },
                                },
                            ],
                        },
                    });
                });
            }
        }
    }
};