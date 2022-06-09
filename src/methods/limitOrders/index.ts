import type { ConstructProviderFetchInput } from '../../types';
import type { LimitOrderToSend, OpenLimitOrder } from './helpers/types';
import {
  BuildLimitOrderFunctions,
  BuildLimitOrderInput,
  constructBuildLimitOrder,
} from './buildOrder';
import {
  CancelLimitOrderFunctions,
  constructCancelLimitOrder,
} from './cancelOrder';
import { constructGetLimitOrders, GetLimitOrdersFunctions } from './getOrders';
import { constructPostLimitOrder, PostLimitOrderFunctions } from './postOrder';
import { constructSignLimitOrder, SignLimitOrderFunctions } from './signOrder';
import { constructFillLimitOrder, FillLimitOrderFunctions } from './fillOrders';
import {
  constructApproveTokenForLimitOrder,
  ApproveTokenForLimitOrderFunctions,
} from './approveForOrder';
import {
  GetLimitOrdersContractFunctions,
  constructGetLimitOrdersContract,
} from './getOrdersContract';
import {
  BuildLimitOrdersTxFunctions,
  constructBuildLimitOrderTx,
} from './transaction';

type SubmitLimitOrder = (
  buildLimitOrderParams: BuildLimitOrderInput,
  extra?: { permitMakerAsset?: string },
  signal?: AbortSignal
) => Promise<OpenLimitOrder>;

export type SubmitLimitOrderFuncs = {
  submitLimitOrder: SubmitLimitOrder;
};

export const constructSubmitLimitOrder = (
  options: ConstructProviderFetchInput<any, 'signTypedDataCall'>
): SubmitLimitOrderFuncs => {
  const { buildLimitOrder } = constructBuildLimitOrder(options);
  const { signLimitOrder } = constructSignLimitOrder(options);
  const { postLimitOrder } = constructPostLimitOrder(options);

  const submitLimitOrder: SubmitLimitOrder = async (
    buildLimitOrderParams,
    extra = {},
    signal
  ) => {
    const orderData = await buildLimitOrder(buildLimitOrderParams);
    const signature = await signLimitOrder(orderData);

    const orderWithSignature: LimitOrderToSend = {
      ...orderData.data,
      ...extra,
      signature,
    };

    const newOrder = await postLimitOrder(orderWithSignature, signal);

    console.log('newOrder created', newOrder);
    return newOrder;
  };

  return { submitLimitOrder };
};

export type LimitOrderHandlers<T> = SubmitLimitOrderFuncs &
  BuildLimitOrderFunctions &
  SignLimitOrderFunctions &
  PostLimitOrderFunctions &
  GetLimitOrdersFunctions &
  GetLimitOrdersContractFunctions &
  BuildLimitOrdersTxFunctions &
  CancelLimitOrderFunctions<T> &
  FillLimitOrderFunctions<T> &
  ApproveTokenForLimitOrderFunctions<T>;

/** @description construct SDK with every LimitOrders-related method, fetching from API and contract calls */
export const constructAllLimitOrdersHandlers = <TxResponse>(
  options: ConstructProviderFetchInput<
    TxResponse,
    'signTypedDataCall' | 'transactCall' | 'staticCall' | 'getLogsCall'
  >
): LimitOrderHandlers<TxResponse> => {
  const limitOrdersGetters = constructGetLimitOrders(options);
  const limitOrdersContractGetter = constructGetLimitOrdersContract(options);

  const limitOrdersSubmit = constructSubmitLimitOrder(options);
  const limitOrdersBuild = constructBuildLimitOrder(options);
  const limitOrdersSign = constructSignLimitOrder(options);
  const limitOrdersPost = constructPostLimitOrder(options);

  const limitOrdersCancel = constructCancelLimitOrder(options);
  const limitOrdersFill = constructFillLimitOrder(options);
  const limitOrdersApproveToken = constructApproveTokenForLimitOrder(options);

  const limitOrdersBuildTx = constructBuildLimitOrderTx(options);

  return {
    ...limitOrdersGetters,
    ...limitOrdersContractGetter,
    ...limitOrdersSubmit,
    ...limitOrdersBuild,
    ...limitOrdersSign,
    ...limitOrdersPost,
    ...limitOrdersCancel,
    ...limitOrdersFill,
    ...limitOrdersApproveToken,
    ...limitOrdersBuildTx,
  };
};
