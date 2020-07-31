import numpy as np
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA
from umap import UMAP

from multidr.tdr import TDR


def plot_results(results):
    plt.figure(figsize=(8, 6))
    for i, Y in enumerate(
        ['Y_n_dt', 'Y_n_td', 'Y_d_nt', 'Y_d_tn', 'Y_t_dn', 'Y_t_nd']):
        plt.subplot(2, 3, i + 1)
        plt.scatter(results[Y][:, 0], results[Y][:, 1], s=5, c='#84B5B2')
        if Y == 'Y_n_dt':
            plt.title('Instance sim ' r'$v^{(D \rightarrow T)}_{n}$')
        elif Y == 'Y_n_td':
            plt.title('Instance sim ' r'$v^{(T \rightarrow D)}_{n}$')
        elif Y == 'Y_d_nt':
            plt.title('Variable sim ' r'$v^{(N \rightarrow T)}_{d}$')
        elif Y == 'Y_d_tn':
            plt.title('Variable sim ' r'$v^{(T \rightarrow N)}_{d}$')
        elif Y == 'Y_t_dn':
            plt.title('Time point sim ' r'$v^{(D \rightarrow N)}_{t}$')
        elif Y == 'Y_t_nd':
            plt.title('Time point sim ' r'$v^{(N \rightarrow D)}_{t}$')
        plt.xticks([])
        plt.yticks([])
    plt.tight_layout()
    plt.show()


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
