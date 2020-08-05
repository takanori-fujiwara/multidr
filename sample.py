import numpy as np
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA
from sklearn.cluster import SpectralClustering
from umap import UMAP

from multidr.tdr import TDR
from multidr.cl import CL


def plot_results(results):
    plt.figure(figsize=(8, 6))
    for i, Z in enumerate(
        ['Z_n_dt', 'Z_n_td', 'Z_d_nt', 'Z_d_tn', 'Z_t_dn', 'Z_t_nd']):
        plt.subplot(2, 3, i + 1)
        plt.scatter(results[Z][:, 0], results[Z][:, 1], s=5, c='#84B5B2')
        if Z == 'Z_n_dt':
            plt.title('Instance sim ' r'$v^{(D \rightarrow T)}_{n}$')
        elif Z == 'Z_n_td':
            plt.title('Instance sim ' r'$v^{(T \rightarrow D)}_{n}$')
        elif Z == 'Z_d_nt':
            plt.title('Variable sim ' r'$v^{(N \rightarrow T)}_{d}$')
        elif Z == 'Z_d_tn':
            plt.title('Variable sim ' r'$v^{(T \rightarrow N)}_{d}$')
        elif Z == 'Z_t_dn':
            plt.title('Time point sim ' r'$v^{(D \rightarrow N)}_{t}$')
        elif Z == 'Z_t_nd':
            plt.title('Time point sim ' r'$v^{(N \rightarrow D)}_{t}$')
        plt.xticks([])
        plt.yticks([])
    plt.tight_layout()
    plt.title('Two-step DR results')
    plt.show()


###
### 1. Two-step DR examples
###

## Examples below are from Fujiwara et al., "A Visual Analytics Framework for
## Reviewing Multivariate Time-Series Data with Dimensionality Reduction", 2020
##
## All the parameters listed here are the same with the one used in the paper
##

# Air qulaity data (Case Study 1)
X = np.load('./data/air_quality/tensor.npy')
n_neighbors = 7
min_dist = 0.15

# # MHEALTH data (Case Study 2)
# # DOWNLOAD DATA FROM https://takanori-fujiwara.github.io/s/multidr/
# X = np.load('./data/mhealth/tensor.npy')
# n_neighbors = 7
# min_dist = 0.15

# # MHEALTH data (Case Study 2)
# # DOWNLOAD DATA FROM https://takanori-fujiwara.github.io/s/multidr/
# X = np.load('./data/highschool_2012/tensor.npy')
# n_neighbors = 15
# min_dist = 0.0

T, N, D = X.shape
tdr = TDR(first_learner=PCA(n_components=1),
          second_learner=UMAP(n_components=2,
                              n_neighbors=n_neighbors,
                              min_dist=min_dist))

results = tdr.fit_transform(X,
                            first_scaling=True,
                            second_scaling=False,
                            verbose=True)

plot_results(results)

###
### 2. Two-step DR interpretation examples
###

## 2-1. parametric mappings
print('Explained variance ratio')
print('t: ' + str(tdr.first_learner['t'].explained_variance_ratio_[0]))
print('n: ' + str(tdr.first_learner['n'].explained_variance_ratio_[0]))
print('d: ' + str(tdr.first_learner['d'].explained_variance_ratio_[0]))

## 2-2. feature contributions
clustering = SpectralClustering(n_clusters=3,
                                assign_labels="discretize",
                                random_state=0).fit(results['Z_n_dt'])
plt.figure(figsize=(6, 6))
plt.scatter(results['Z_n_dt'][:, 0],
            results['Z_n_dt'][:, 1],
            s=5,
            c=clustering.labels_)
plt.title('Z_n_dt with spectral clustering')
plt.show()

Y_nt = tdr.Y_tn.transpose()

cl = CL()
plt.figure(figsize=(8, 4))

for cluster_id in np.unique(clustering.labels_):
    cluster = Y_nt[clustering.labels_ == cluster_id, :]
    others = Y_nt[clustering.labels_ != cluster_id, :]
    cl.fit(cluster, others, var_thres_ratio=0.5, max_log_alpha=2)
    plt.plot(cl.fcs, c=plt.get_cmap('Accent')(cluster_id))

plt.xlabel('time')
plt.ylabel('Feature contribution (without scaling)')
plt.title('Feature cotributions')
plt.show()
