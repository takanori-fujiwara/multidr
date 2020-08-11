import json
import os
import glob

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA
from sklearn.cluster import SpectralClustering
from umap import UMAP

from multidr.tdr import TDR
from multidr.cl import CL

###
### 1. Two-step DR
###
# Air qulaity data (Case Study 1)
X = np.load('./data/air_quality/tensor.npy')
n_neighbors = 7
min_dist = 0.15

T, N, D = X.shape
tdr = TDR(first_learner=PCA(n_components=1),
          second_learner=UMAP(n_components=2,
                              n_neighbors=n_neighbors,
                              min_dist=min_dist))

results = tdr.fit_transform(X,
                            first_scaling=True,
                            second_scaling=False,
                            verbose=True)

###
### 2. Output to js and npy
###

out_file_name = 'air_quality2'
## 2-1. server side
np.save(f'ui/server/data/{out_file_name}_Y_tn.npy', tdr.Y_tn)
np.save(f'ui/server/data/{out_file_name}_Y_nd.npy', tdr.Y_nd)
np.save(f'ui/server/data/{out_file_name}_Y_dt.npy', tdr.Y_dt)


## 2-2. client side
def scale_layout(points, bound=[-1, 1]):
    p_min = np.min(points, axis=0)
    p_max = np.max(points, axis=0)

    w = p_max[0] - p_min[0]
    h = p_max[1] - p_min[1]
    d = max([w, h])

    s = 1.0
    if d > 0:
        s = (bound[1] - bound[0]) / d
    offset = [(d - w) * .5, (d - h) * .5]

    return bound[0] + (offset + points - p_min) * s


instances = pd.read_csv('./data/air_quality/instances.csv')
variables = pd.read_csv('./data/air_quality/variables.csv')
times = pd.read_csv('./data/air_quality/times.csv')

instances_dt = []
for n, emb_pos in enumerate(scale_layout(results['Z_n_dt'])):
    instances_dt.append({
        'n': n,
        'embPos': emb_pos.tolist(),
        'name': instances['name'].iloc[n],
        'aux': {
            'x': float(instances['x'].iloc[n]),
            'y': float(instances['y'].iloc[n]),
        },
    })

instances_td = []
for n, emb_pos in enumerate(scale_layout(results['Z_n_td'])):
    instances_td.append({
        'n': n,
        'embPos': emb_pos.tolist(),
        'name': instances['name'].iloc[n],
        'aux': {
            'x': float(instances['x'].iloc[n]),
            'y': float(instances['y'].iloc[n]),
        },
    })

variables_tn = []
for d, emb_pos in enumerate(scale_layout(results['Z_d_tn'])):
    variables_tn.append({
        'd': d,
        'embPos': emb_pos.tolist(),
        'name': variables['name'].iloc[d]
    })

variables_nt = []
for d, emb_pos in enumerate(scale_layout(results['Z_d_nt'])):
    variables_nt.append({
        'd': d,
        'embPos': emb_pos.tolist(),
        'name': variables['name'].iloc[d]
    })

times_dn = []
for t, emb_pos in enumerate(scale_layout(results['Z_t_dn'])):
    times_dn.append({
        't': t,
        'embPos': emb_pos.tolist(),
        'time': times['check_time'].iloc[t]
    })

times_nd = []
for t, emb_pos in enumerate(scale_layout(results['Z_t_nd'])):
    times_nd.append({
        't': t,
        'embPos': emb_pos.tolist(),
        'time': times['check_time'].iloc[t]
    })

json_data = json.dumps({
    'siViewInfo': {
        'instance': 'map',
        'time': 'calendar'
    },
    'instances': {
        'Z_n_dt': instances_dt,
        'Z_n_td': instances_td
    },
    'variables': {
        'Z_d_tn': variables_tn,
        'Z_d_nt': variables_nt
    },
    'timePoints': {
        'Z_t_dn': times_dn,
        'Z_t_nd': times_nd,
    },
    'firstDrInfo': {
        'explainedVarianceRatio': {
            'n': tdr.first_learner['n'].explained_variance_ratio_[0],
            'd': tdr.first_learner['d'].explained_variance_ratio_[0],
            't': tdr.first_learner['t'].explained_variance_ratio_[0]
        },
        'components': {
            'n': tdr.first_learner['n'].components_[0].tolist(),
            'd': tdr.first_learner['d'].components_[0].tolist(),
            't': tdr.first_learner['t'].components_[0].tolist()
        }
    }
})

with open(f'ui/client/data/{out_file_name}.json', 'w') as f:
    f.write(json_data)

if os.path.exists('ui/client/data/file_list.json'):
    os.remove('ui/client/data/file_list.json')
file_names = [
    os.path.basename(x).split('.json')[0]
    for x in glob.glob('ui/client/data/*.json')
]
with open('ui/client/data/file_list.json', 'w') as f:
    f.write(json.dumps({'fileNames': sorted(file_names)}))
