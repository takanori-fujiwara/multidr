import numpy as np
from scipy.stats import pearsonr

from ccpca import CCPCA


class CL():
    """TDR: Two-step dimensionality reduction (DR) to project a third-order
    tensor onto a lower-dimensional space

    Parameters
    ----------
    learner: Class Object for DR, optional, (default=None)
        Contrastive representation learning class object. Any class
        object that (1) has fit as a class method, (2) can take two matrices as
        the first parameters of fit, and (3) has get_feat_contribs as a class
        method (e.g., ccPCA, https://github.com/takanori-fujiwara/ccpca).
        If None, ccPCA is set as a learner.
    Attributes
    ----------
    learner: the same with the parameter above.
    fcs: array-like, shape(n_features, 1)
        Feature contributions.
    ----------
    Examples
    --------
    >>> import numpy as np
    >>> import matplotlib.pyplot as plt
    >>> from sklearn.decomposition import PCA
    >>> from sklearn.cluster import SpectralClustering
    >>> from umap import UMAP

    >>> from multidr.tdr import TDR
    >>> from multidr.cl import CL

    >>> X = np.load('./data/air_quality/tensor.npy')
    >>> tdr = TDR(first_learner=PCA(n_components=1),
    ...           second_learner=UMAP(n_components=2,
    ...                               n_neighbors=7,
    ...                               min_dist=0.15))

    >>> results = tdr.fit_transform(X,
    ...                             first_scaling=True,
    ...                             second_scaling=False,
    ...                             verbose=True)

    >>> clustering = SpectralClustering(n_clusters=3,
    ...                                 assign_labels="discretize",
    ...                                 random_state=0).fit(results['Z_n_dt'])

    >>> plt.figure(figsize=(6, 6))
    >>> plt.scatter(results['Z_n_dt'][:, 0],
    ...             results['Z_n_dt'][:, 1],
    ...             s=5,
    ...             c=clustering.labels_)
    >>> plt.title('Z_n_dt with spectral clustering')
    >>> plt.show()

    >>> Y_nt = tdr.Y_tn.transpose()

    >>> cl = CL()

    >>> plt.figure(figsize=(8, 4))

    >>> for cluster_id in np.unique(clustering.labels_):
    ...     cluster = Y_nt[clustering.labels_ == cluster_id, :]
    ...     others = Y_nt[clustering.labels_ != cluster_id, :]
    ...     cl.fit(cluster, others, var_thres_ratio=0.5, max_log_alpha=2)
    ...     plt.plot(cl.fcs, c=plt.get_cmap('Accent')(cluster_id))

    >>> plt.xlabel('time')
    >>> plt.ylabel('Feature contribution (without scaling)')
    >>> plt.title('Feature cotributions')
    >>> plt.show()
    """
    def __init__(self, learner=None):
        self.learner = None
        self.fcs = None
        self.set_learner(learner)

    def fit(self, K, R, **contrast_learner_kwargs):
        """If using auto alpha selection, find the best contrast parameter alpha
        first. Otherwise, input alpha value is used for fit. Then, fit using
        cPCA with the (best) alpha. For cPCA, a matrix E concatenating K and R
        will be used as a foreground dataset and R will be used as a background
        dataset.

        Parameters
        ----------
        K: array-like, shape(n_samples1, n_components)
            A target cluster.
        R: array of array-like, shape(n_samples2, n_components)
            Background datasets.
        contrast_learner_kwargs: additional keywards for input parameters.
            e.g., for ccPCA, var_thres_ratio=0.5, max_log_alpha=2
        Returns
        -------
        self.
        """
        self.learner.fit(K, R, **contrast_learner_kwargs)
        self.fcs = self.learner.get_feat_contribs()

        X = np.vstack((K, R))
        selected = np.array([1] * K.shape[0] + [0] * R.shape[0])

        ## adjust fcs direcrtion

        # check pearson corr between "selected or not" and "feature values"
        # if selected rows tend to have higher values corr becomes positive
        corr_selected_fval = np.array(
            [pearsonr(selected, X[:, col])[0] for col in range(X.shape[1])])

        # compute score of agreement of correlation and fcs directions
        # (more correlated or higher absolute value of fcs will have heavier weights)
        agreement_score = np.sum(corr_selected_fval * self.fcs)

        if agreement_score < 0:
            self.fcs = -self.fcs

        return self

    def set_learner(self, learner):
        """Set a contrastive representation learning method.

        Parameters
        ----------
        learner: Class object for contrastive learning.
            Contrastive representation learning class object. Any class
            object that (1) has fit as a class method, (2) can take two matrices as
            the first parameters of fit, and (3) has get_feat_contribs as a class
            method (e.g., ccPCA, https://github.com/takanori-fujiwara/ccpca).
            If None, ccPCA is set as a learner.
        Returns
        -------
        self.
        """
        if learner is None:
            self.learner = CCPCA()
        else:
            self.learner = learner
