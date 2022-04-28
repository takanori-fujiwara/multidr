# Standard Library
import asyncio
import concurrent.futures
import functools
import json
import signal
import sys
from enum import IntEnum

# Third Party Library
import numpy as np
from scipy.stats import pearsonr
from scipy.spatial.distance import cosine
import websockets

from multidr.cl import CL
from ccpca import CCPCA
from logger import logger


class Message(IntEnum):
    addNewFcs = 0
    getHistInfo = 1

    @property
    def key(self):
        if self == Message.addNewFcs:
            return 'addNewFcs'
        elif self == Message.getHistInfo:
            return 'getHistInfo'

    @property
    def label(self):
        if self == Message.addNewFcs:
            return 'addNewFcs'
        elif self == Message.getHistInfo:
            return 'getHistInfo'


def _load_data_by_emb_type(emb_type, data_key):
    X = None
    if emb_type == 'Z_n_dt':
        X = np.load('./data/' + data_key + '_Y_tn.npy').transpose()
    elif emb_type == 'Z_n_td':
        X = np.load('./data/' + data_key + '_Y_nd.npy')
    elif emb_type == 'Z_d_nt':
        X = np.load('./data/' + data_key + '_Y_dt.npy')
    elif emb_type == 'Z_d_tn':
        X = np.load('./data/' + data_key + '_Y_nd.npy').transpose()
    elif emb_type == 'Z_t_dn':
        X = np.load('./data/' + data_key + '_Y_tn.npy')
    elif emb_type == 'Z_t_nd':
        X = np.load('./data/' + data_key + '_Y_dt.npy').transpose()
    return X


def _get_fc_info(args, emb_type):
    X = _load_data_by_emb_type(args[emb_type], args['dataKey'])

    selected = np.array(args['selected'], dtype=bool)

    # ccpca with sign adjustment
    cl = CL(learner=CCPCA(n_components=1))
    cl.fit(X[selected, :],
           X[np.logical_not(selected), :],
           var_thres_ratio=0.5,
           max_log_alpha=2)

    fcs = cl.fcs

    return (fcs, selected)


def _write_new_fcs_response(args):
    fcs, selected = _get_fc_info(args, 'embType')
    fcs2, _ = _get_fc_info(args, 'embType2')

    return json.dumps({
        'action': Message.addNewFcs,
        'content': {
            'fcs': fcs.tolist(),
            'fcs2': fcs2.tolist(),
            'indices': np.where(selected)[0].tolist(),
        }
    })


def _write_hist_info_response(args):
    X = _load_data_by_emb_type(args['embType'], args['dataKey'])

    col = args['selectedCol']
    group_rows = np.array(args['groupRows'])

    n_bins = 20
    maxVal = np.max(X[:, col])
    minVal = np.min(X[:, col])

    unselected_rows = np.array([True] * X.shape[0])
    for rows in group_rows:
        unselected_rows[rows] = False

    bg_freq, _ = np.histogram(X[unselected_rows, col],
                              bins=n_bins,
                              range=(minVal, maxVal))
    bg_freq = (bg_freq / np.sum(bg_freq)).tolist()

    rel_freqs = {'targets': [], 'background': bg_freq}
    for rows in group_rows:
        tg_freq, _ = np.histogram(X[rows, col],
                                  bins=n_bins,
                                  range=(minVal, maxVal))
        rel_freqs['targets'].append((tg_freq / np.sum(tg_freq)).tolist())

    return json.dumps({
        'action': Message.getHistInfo,
        'content': {
            'relFreqs':
            rel_freqs,
            'freqMax':
            max(np.max(rel_freqs['targets']), np.max(rel_freqs['background'])),
            'nBins':
            n_bins,
            'valMin':
            int(minVal),
            'valMax':
            int(maxVal),
            'pos':
            args['pos'],
            'embType':
            args['embType']
        }
    })


async def _send(event_loop, executor, ws, args, func):
    # logger.info(f"_send_something: {args}")
    buf = await event_loop.run_in_executor(executor, func, args)
    await ws.send(buf)


async def _serve(event_loop, executor, stop, host='0.0.0.0', port=9000):
    logger.info(f'Server started host={host} port={port}')

    bound_handler = functools.partial(_handler,
                                      event_loop=event_loop,
                                      executor=executor)

    async with websockets.serve(bound_handler, host, port):
        await stop


async def _handler(ws, path, event_loop, executor):
    logger.info(f'New connection: {ws.remote_address}')

    try:
        while True:
            logger.info(f'Waiting: {ws.remote_address}')

            recv_msg = await ws.recv()

            asyncio.ensure_future(
                _handle_message(event_loop, executor, ws, recv_msg))

    except websockets.ConnectionClosed as e:
        logger.info(f'ConnectionClosed: {ws.remote_address}')

    except Exception as e:
        logger.warning(f'Unexpected exception {e}: {sys.exc_info()[0]}')


async def _handle_message(event_loop, executor, ws, recv_msg):
    m = json.loads(recv_msg)
    m_action = m['action']

    # logger.info(f'Received Message from {ws.remote_address}: message={m}')

    if m_action == Message.addNewFcs:
        await _send(event_loop, executor, ws, m['content'],
                    _write_new_fcs_response)
    elif m_action == Message.getHistInfo:
        await _send(event_loop, executor, ws, m['content'],
                    _write_hist_info_response)


def start_websocket_server(host='0.0.0.0', port=9000, max_workers=4):
    if not sys.platform.startswith('win'):
        import uvloop
        asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())

        event_loop = asyncio.get_event_loop()
        executor = concurrent.futures.ThreadPoolExecutor(
            max_workers=max_workers)

        # The stop condition is set when receiving SIGINT.
        stop = asyncio.Future()

        event_loop.add_signal_handler(signal.SIGINT, stop.set_result, True)

        # Run the server until the stop condition is met.
        event_loop.run_until_complete(
            _serve(event_loop, executor, stop, host, port))
    else:  # windows
        # Windows cannot use uvloop library and signals
        asyncio.set_event_loop_policy(asyncio.DefaultEventLoopPolicy())

        event_loop = asyncio.get_event_loop()
        executor = concurrent.futures.ThreadPoolExecutor(
            max_workers=max_workers)

        stop = asyncio.Future()

        try:
            event_loop.run_until_complete(
                _serve(event_loop, executor, stop, host, port))
        finally:
            event_loop.close()


start_websocket_server(host='0.0.0.0', port=9000, max_workers=4)
