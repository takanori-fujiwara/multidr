import numpy as np
import copy
from sklearn.decomposition import PCA
from sklearn import preprocessing
from umap import UMAP


class TDR():
    """TDR: Two-step dimensionality reduction (DR) to project a third-order
    tensor onto a lower-dimensional space

    Parameters
    ----------
    first_learner: Class Object for DR, optional, (default=None)
        Dimensionality reduction class object for the first DR step. Any class
        object that has fit_transform as a class method (e.g., PCA in
        scikit-learn). If None, sklearn's PCA is set as a learner (i.e.,
        PCA(n_components=1)).
        Also, to set a different DR for individual modes, you can input as a
        dict. e.g., {'t': PCA(n_components=1), 'n': PCA(n_components=1), 'd':
        PCA(n_components=1)}
    second_learner: Class Object for DR, optional, (default=None)
        Dimensionality reduction class object for the second DR step. Any class
        object that has fit_transform as a class method (e.g., UMAP in
        umap-learn). If None, UMAP is set as a learner (i.e.,
        UMAP(n_components=2)).
        Also, to set a different DR for individual modes, you can input as a
        dict. e.g., {'t': UMAP(n_components=2), 'n': PCA(n_components=2), 'd':
        TSNE(n_components=2)}
    Attributes
    ----------
    first_learner: the same with the input parameter one.
    second_learner: the same with the input parameter one.
    Y_tn: ndarray, shape (n_time_points, n_instances)
        The matrix Y obtained by applying the first DR along a variable mode.
        Rows and columns correspond to time points and intances, repectively.
    Y_nd: ndarray, shape (n_instances, n_variables)
        The matrix Y obtained by applying the first DR along a time mode.
        Rows and columns correspond to intances and variables, repectively.
    Y_dt: ndarray, shape (n_variables, n_time_points)
        The matrix Y obtained by applying the first DR along an instance mode.
        Rows and columns correspond to variables and time points, repectively.
    Z_n_dt: ndarray, shape (n_instances, n_components_of_2nd_DR)
        The matrix Z obtained by applying the first DR along a variable mode
        and then the second DR along a time mode (1st DR : d, 2nd DR: t).
    Z_n_td: ndarray, shape (n_instances, n_components_of_2nd_DR)
        The matrix Z obtained by applying the first DR along a time mode
        and then the second DR along a variable mode (1st DR: t, 2nd DR: d).
    Z_d_nt: ndarray, shape (n_variables, n_components_of_2nd_DR)
        The matrix Z obtained by applying the first DR along an instance mode
        and then the second DR along a time mode (1st DR: n, 2nd DR: t).
    Z_d_tn: ndarray, shape (n_variables, n_components_of_2nd_DR)
        The matrix Z obtained by applying the first DR along a time mode
        and then the second DR along an instance mode (1st DR: t, 2nd DR: n).
    Z_t_dn: ndarray, shape (n_time_points, n_components_of_2nd_DR)
        The matrix Z obtained by applying the first DR along a variable mode
        and then the second DR along an instance mode (1st DR: d, 2nd DR: n).
    Z_t_nd: ndarray, shape (n_time_points, n_components_of_2nd_DR)
        The matrix Z obtained by applying the first DR along an instance mode
        and then the second DR along a variable mode (1st DR: n, 2nd DR: d).
    ----------
    Examples
    --------
    >>> import numpy as np
    >>> import matplotlib.pyplot as plt
    >>> from sklearn.decomposition import PCA
    >>> from umap import UMAP

    >>> from multidr.tdr import TDR

    >>> def plot_results(results):
    ...     plt.figure(figsize=(8, 6))
    ...     for i, Z in enumerate(
    ...         ['Z_n_dt', 'Z_n_td', 'Z_d_nt', 'Z_d_tn', 'Z_t_dn', 'Z_t_nd']):
    ...         plt.subplot(2, 3, i + 1)
    ...         plt.scatter(results[Z][:, 0], results[Z][:, 1], s=5, c='#84B5B2')
    ...         if Z == 'Z_n_dt':
    ...             plt.title('Instance sim ' r'$v^{(D \rightarrow T)}_{n}$')
    ...         elif Z == 'Z_n_td':
    ...             plt.title('Instance sim ' r'$v^{(T \rightarrow D)}_{n}$')
    ...         elif Z == 'Z_d_nt':
    ...             plt.title('Variable sim ' r'$v^{(N \rightarrow T)}_{d}$')
    ...         elif Z == 'Z_d_tn':
    ...             plt.title('Variable sim ' r'$v^{(T \rightarrow N)}_{d}$')
    ...         elif Z == 'Z_t_dn':
    ...             plt.title('Time point sim ' r'$v^{(D \rightarrow N)}_{t}$')
    ...         elif Z == 'Z_t_nd':
    ...             plt.title('Time point sim ' r'$v^{(N \rightarrow D)}_{t}$')
    ...         plt.xticks([])
    ...         plt.yticks([])
    ...     plt.tight_layout()
    ...     plt.title('Two-step DR results')
    ...     plt.show()

    >>> X = np.load('./data/air_quality/tensor.npy')
    >>> tdr = TDR(first_learner=PCA(n_components=1),
    ...           second_learner=UMAP(n_components=2,
    ...                               n_neighbors=7,
    ...                               min_dist=0.15))

    >>> results = tdr.fit_transform(X,
    ...                             first_scaling=True,
    ...                             second_scaling=False,
    ...                             verbose=True)

    >>> plot_results(results)
    """
    def __init__(self, first_learner=None, second_learner=None):
        self.first_learner = None
        self.second_learner = None
        self.Y_tn = None
        self.Y_nd = None
        self.Y_dt = None
        self.Z_n_dt = None
        self.Z_n_td = None
        self.Z_d_nt = None
        self.Z_d_tn = None
        self.Z_t_dn = None
        self.Z_t_nd = None

        self.set_first_learner(first_learner)
        self.set_second_learner(second_learner)

    def fit_transform(self,
                      X,
                      first_scaling=True,
                      second_scaling=True,
                      verbose=False):
        """Apply the first and second DR and then return all DR results of 6
        patterns.

        Parameters
        ----------
        X: array-like, shape(n_time_points, n_instances, n_variables)
            Input third-order tensor.
        first_scaling: boolean or dict of booleans, optional, default=True
            If True, apply starndarziation before applying the first DR.
            To set scaling for individual modes, you can input as a dict. e.g.,
            {'t': False, 'n': False, 'd': True}
        second_scaling: boolean or dict of booleans, optional, default=True
            If True, apply starndarziation before applying the second DR.
            To set scaling for individual modes, you can input as a dict. e.g.,
            {'t': False, 'n': False, 'd': True}
        verbose: boolean, optional, default=False
            If True, print the progress of two-step DR, etc.
        Returns
        -------
        Dict of {"Z_n_dt", "Z_n_td", "Z_d_nt", "Z_d_tn", "Z_t_dn", "Z_t_nd"}.
            Z_n_dt: ndarray, shape (n_instances, n_components_of_2nd_DR)
                The matrix Z obtained by applying the first DR along a variable mode
                and then the second DR along a time mode (1st DR : d, 2nd DR: t).
            Z_n_td: ndarray, shape (n_instances, n_components_of_2nd_DR)
                The matrix Z obtained by applying the first DR along a time mode
                and then the second DR along a variable mode (1st DR: t, 2nd DR: d).
            Z_d_nt: ndarray, shape (n_variables, n_components_of_2nd_DR)
                The matrix Z obtained by applying the first DR along an instance mode
                and then the second DR along a time mode (1st DR: n, 2nd DR: t).
            Z_d_tn: ndarray, shape (n_variables, n_components_of_2nd_DR)
                The matrix Z obtained by applying the first DR along a time mode
                and then the second DR along an instance mode (1st DR: t, 2nd DR: n).
            Z_t_dn: ndarray, shape (n_time_points, n_components_of_2nd_DR)
                The matrix Z obtained by applying the first DR along a variable mode
                and then the second DR along an instance mode (1st DR: d, 2nd DR: n).
            Z_t_nd: ndarray, shape (n_time_points, n_components_of_2nd_DR)
                The matrix Z obtained by applying the first DR along an instance mode
                and then the second DR along a variable mode (1st DR: n, 2nd DR: d).
        """
        self.learn_first_repr(X, scaling=first_scaling, verbose=verbose)
        self.learn_second_repr(self.Y_tn,
                               self.Y_nd,
                               self.Y_dt,
                               scaling=second_scaling,
                               verbose=verbose)

        return {
            "Z_n_dt": self.Z_n_dt,
            "Z_n_td": self.Z_n_td,
            "Z_d_nt": self.Z_d_nt,
            "Z_d_tn": self.Z_d_tn,
            "Z_t_dn": self.Z_t_dn,
            "Z_t_nd": self.Z_t_nd
        }

    def learn_first_repr(self, X, scaling=True, verbose=False):
        """Apply the first DR to learn Y_tn, Y_nd, Y_dt.

        Parameters
        ----------
        X: array-like, shape(n_time_points, n_instances, n_variables)
            Input third-order tensor.
        scaling: boolean or dict of booleans, optional, default=True
            If True, apply starndarziation before applying the first DR.
            To set scaling for individual modes, you can input as a dict. e.g.,
            {'t': False, 'n': False, 'd': True}
        verbose: boolean, optional, default=False
            If True, print the progress of two-step DR, etc.
        Returns
        -------
        self
        """

        T, N, D = X.shape
        X_tn_d = np.zeros((T * N, D))
        X_nd_t = np.zeros((N * D, T))
        X_dt_n = np.zeros((D * T, N))

        # unfolding
        for t in range(T):
            X_tn_d[t * N:(t + 1) * N, :] = X[t, :, :]
        for n in range(N):
            X_nd_t[n * D:(n + 1) * D, :] = X[:, n, :].T
        for d in range(D):
            X_dt_n[d * T:(d + 1) * T, :] = X[:, :, d]

        if verbose:
            print("reshape done")

        # set scaler
        scl = {'t': lambda a: a, 'n': lambda a: a, 'd': lambda a: a}
        if type(scaling) is dict:
            scl['t'] = preprocessing.scale if scaling['t'] else lambda a: a
            scl['n'] = preprocessing.scale if scaling['n'] else lambda a: a
            scl['d'] = preprocessing.scale if scaling['d'] else lambda a: a
        elif scaling:
            scl['d'] = preprocessing.scale
            scl['t'] = preprocessing.scale
            scl['n'] = preprocessing.scale

        # first DR
        y_nd_t = self.first_learner['t'].fit_transform(scl['t'](X_nd_t))
        y_dt_n = self.first_learner['n'].fit_transform(scl['n'](X_dt_n))
        y_tn_d = self.first_learner['d'].fit_transform(scl['d'](X_tn_d))
        if verbose:
            if 'explained_variance_ratio_' in self.first_learner['t'].__dict__:
                print("exp var ratio for compression of time ponts:",
                      self.first_learner['t'].explained_variance_ratio_)
            if 'explained_variance_ratio_' in self.first_learner['n'].__dict__:
                print("exp var ratio for compression of instances",
                      self.first_learner['n'].explained_variance_ratio_)
            if 'explained_variance_ratio_' in self.first_learner['d'].__dict__:
                print("exp var ratio for compression of variables:",
                      self.first_learner['d'].explained_variance_ratio_)

        # sign flip if the weights tend to be negative
        if 'components_' in self.first_learner['t'].__dict__:
            if np.sum(self.first_learner['t'].components_) < 0:
                self.first_learner['t'].components_ *= -1
                y_nd_t *= -1
        if 'components_' in self.first_learner['n'].__dict__:
            if np.sum(self.first_learner['n'].components_) < 0:
                self.first_learner['n'].components_ *= -1
                y_dt_n *= -1
        if 'components_' in self.first_learner['d'].__dict__:
            if np.sum(self.first_learner['d'].components_) < 0:
                self.first_learner['d'].components_ *= -1
                y_tn_d *= -1

        # folding
        self.Y_tn = y_tn_d.reshape((T, N))
        self.Y_nd = y_nd_t.reshape((N, D))
        self.Y_dt = y_dt_n.reshape((D, T))

        if verbose:
            print("first repr done")

        return self

    def learn_second_repr(self, Y_tn, Y_nd, Y_dt, scaling=True, verbose=False):
        """Apply the first DR to learn Y_tn, Y_nd, Y_dt.

        Parameters
        ----------
        Y_tn: ndarray, shape (n_time_points, n_instances)
            The matrix Y obtained by applying the first DR along a variable mode.
            Rows and columns correspond to time points and intances, repectively.
        Y_nd: ndarray, shape (n_instances, n_variables)
            The matrix Y obtained by applying the first DR along a time mode.
            Rows and columns correspond to intances and variables, repectively.
        Y_dt: ndarray, shape (n_variables, n_time_points)
            The matrix Y obtained by applying the first DR along an instance mode.
            Rows and columns correspond to variables and time points, repectively.
        scaling: boolean or dict of booleans, optional, default=True
            If True, apply starndarziation before applying the second DR.
            To set scaling for individual modes, you can input as a dict. e.g.,
            {'t': False, 'n': False, 'd': True}
        verbose: boolean, optional, default=False
            If True, print the progress of two-step DR, etc.
        Returns
        -------
        self
        """

        # set scaler
        scl = {'t': lambda a: a, 'n': lambda a: a, 'd': lambda a: a}
        if type(scaling) is dict:
            scl['t'] = preprocessing.scale if scaling['t'] else lambda a: a
            scl['n'] = preprocessing.scale if scaling['n'] else lambda a: a
            scl['d'] = preprocessing.scale if scaling['d'] else lambda a: a
        elif scaling:
            scl['d'] = preprocessing.scale
            scl['t'] = preprocessing.scale
            scl['n'] = preprocessing.scale

        # second DR
        ### Z_n_dt ###
        try:
            self.Z_n_dt = self.second_learner['t'].fit_transform(scl['t'](
                Y_tn.T))
        except:
            print('Second learner had errors. Assign random positions')
            self.Z_n_dt = np.random.rand(Y_tn.T.shape[0],
                                         self.second_learner['t'].n_components)
        if verbose:
            print("Z_n_dt done")

        ### Z_d_nt ###
        try:
            self.Z_d_nt = self.second_learner['t'].fit_transform(
                scl['t'](Y_dt))
        except:
            print('Second learner had errors. Assign random positions')
            self.Z_d_nt = np.random.rand(Y_dt.shape[0],
                                         self.second_learner['t'].n_components)
        if verbose:
            print("Z_d_nt done")

        ### Z_t_dn ###
        try:
            self.Z_t_dn = self.second_learner['n'].fit_transform(
                scl['n'](Y_tn))
        except:
            print('Second learner had errors. Assign random positions')
            self.Z_t_dn = np.random.rand(Y_tn.shape[0],
                                         self.second_learner['n'].n_components)
        if verbose:
            print("Z_t_dn done")

        ### Z_d_tn ###
        try:
            self.Z_d_tn = self.second_learner['n'].fit_transform(scl['n'](
                Y_nd.T))
        except:
            print('Second learner had errors. Assign random positions')
            self.Z_d_tn = np.random.rand(Y_nd.T.shape[0],
                                         self.second_learner['n'].n_components)
        if verbose:
            print("Z_d_tn done")

        ### Z_t_nd ###
        try:
            self.Z_t_nd = self.second_learner['d'].fit_transform(scl['d'](
                Y_dt.T))
        except:
            print('Second learner had errors. Assign random positions')
            self.Z_t_nd = np.random.rand(Y_dt.T.shape[0],
                                         self.second_learner['d'].n_components)
        if verbose:
            print("Z_t_nd done")

        ### Z_n_td ###
        try:
            self.Z_n_td = self.second_learner['d'].fit_transform(
                scl['d'](Y_nd))
        except:
            print('Second learner had errors. Assign random positions')
            self.Z_n_td = np.random.rand(Y_nd.shape[0],
                                         self.second_learner['d'].n_components)
        if verbose:
            print("Z_n_td done")

        if verbose:
            print("second repr done")

        return self

    def set_first_learner(self, first_learner):
        """Set a method for the first DR.

        Parameters
        ----------
        first_learner: Class Object for DR
            Dimensionality reduction class object for the first DR step. Any class
            object that has fit_transform as a class method (e.g., PCA in
            scikit-learn). If None, sklearn's PCA is set as a learner (i.e.,
            PCA(n_components=1)).
            Also, to set a different DR for individual modes, you can input as a
            dict. e.g., {'t': PCA(n_components=1), 'n': PCA(n_components=1), 'd':
            PCA(n_components=1)}
        Returns
        -------
        self
        """
        if first_learner is None:
            self.first_learner = {
                'n': PCA(n_components=1),
                'd': PCA(n_components=1),
                't': PCA(n_components=1)
            }
        elif type(first_learner) is not dict:
            self.first_learner = {
                'n': copy.deepcopy(first_learner),
                'd': copy.deepcopy(first_learner),
                't': copy.deepcopy(first_learner)
            }
        else:
            self.first_learner = first_learner

        return self

    def set_second_learner(self, second_learner):
        """Set a method for the second DR.

        Parameters
        ----------
        second_learner: Class Object for DR, optional, (default=None)
            Dimensionality reduction class object for the second DR step. Any class
            object that has fit_transform as a class method (e.g., UMAP in
            umap-learn). If None, UMAP is set as a learner (i.e.,
            UMAP(n_components=2)).
            Also, to set a different DR for individual modes, you can input as a
            dict. e.g., {'t': UMAP(n_components=2), 'n': PCA(n_components=2), 'd':
            TSNE(n_components=2)}
        Returns
        -------
        self
        """
        if second_learner is None:
            self.second_learner = {'n': UMAP(), 'd': UMAP(), 't': UMAP()}
        elif type(second_learner) is not dict:
            self.second_learner = {
                'n': copy.deepcopy(second_learner),
                'd': copy.deepcopy(second_learner),
                't': copy.deepcopy(second_learner)
            }
        else:
            self.second_learner = second_learner

        return self
