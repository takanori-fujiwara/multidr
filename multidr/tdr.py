import numpy as np
import copy
from sklearn.decomposition import PCA
from sklearn import preprocessing
from umap import UMAP


class TDR():
    def __init__(self, first_learner=None, second_learner=None):
        self.first_learner = None
        self.second_learner = None
        self.X_tn = None
        self.X_nd = None
        self.X_dt = None
        self.Y_n_dt = None
        self.Y_n_td = None
        self.Y_d_nt = None
        self.Y_d_tn = None
        self.Y_t_dn = None
        self.Y_t_nd = None

        self.set_first_learner(first_learner)
        self.set_second_learner(second_learner)

    def fit_transform(self,
                      X,
                      first_scaling=True,
                      second_scaling=True,
                      verbose=False):
        self.learn_first_repr(X, scaling=first_scaling, verbose=verbose)
        self.learn_second_repr(self.X_tn,
                               self.X_nd,
                               self.X_dt,
                               scaling=second_scaling,
                               verbose=verbose)

        return {
            "Y_n_dt": self.Y_n_dt,
            "Y_n_td": self.Y_n_td,
            "Y_d_nt": self.Y_d_nt,
            "Y_d_tn": self.Y_d_tn,
            "Y_t_dn": self.Y_t_dn,
            "Y_t_nd": self.Y_t_nd
        }

    def learn_first_repr(self, X, scaling=True, verbose=False):
        T, N, D = X.shape
        X_tn_d = np.zeros((T * N, D))
        X_nd_t = np.zeros((N * D, T))
        X_dt_n = np.zeros((D * T, N))

        # unfolding
        for t in range(T):
            X_tn_d[t * N:(t + 1) * N, :] = X[t, :, :]
        for n in range(N):
            X_nd_t[n * D:(n + 1) * D, :] = X[:, n, :].transpose()
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
        Y_nd_t = self.first_learner['t'].fit_transform(scl['t'](X_nd_t))
        Y_dt_n = self.first_learner['n'].fit_transform(scl['n'](X_dt_n))
        Y_tn_d = self.first_learner['d'].fit_transform(scl['d'](X_tn_d))
        if verbose:
            if 'explained_variance_ratio_' in self.first_learner['t'].__dict__:
                print("exp var ratio of X_nd_t:",
                      self.first_learner['t'].explained_variance_ratio_)
            if 'explained_variance_ratio_' in self.first_learner['n'].__dict__:
                print("exp var ratio of X_dt_n:",
                      self.first_learner['n'].explained_variance_ratio_)
            if 'explained_variance_ratio_' in self.first_learner['d'].__dict__:
                print("exp var ratio of X_tn_d:",
                      self.first_learner['d'].explained_variance_ratio_)

        # sign flip if the weights tend to be negative
        if 'components_' in self.first_learner['t'].__dict__:
            if np.sum(self.first_learner['t'].components_) < 0:
                self.first_learner['t'].components_ *= -1
                Y_nd_t *= -1
        if 'components_' in self.first_learner['n'].__dict__:
            if np.sum(self.first_learner['n'].components_) < 0:
                self.first_learner['n'].components_ *= -1
                Y_dt_n *= -1
        if 'components_' in self.first_learner['d'].__dict__:
            if np.sum(self.first_learner['d'].components_) < 0:
                self.first_learner['d'].components_ *= -1
                Y_tn_d *= -1

        # folding
        self.X_tn = Y_tn_d.reshape((T, N))
        self.X_nd = Y_nd_t.reshape((N, D))
        self.X_dt = Y_dt_n.reshape((D, T))

        if verbose:
            print("first repr done")

    def learn_second_repr(self, X_tn, X_nd, X_dt, scaling=True, verbose=False):
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
        self.Y_n_dt = self.second_learner['t'].fit_transform(scl['t'](
            X_tn.transpose()))
        if verbose:
            print("Y_n_dt done")

        self.Y_d_nt = self.second_learner['t'].fit_transform(scl['t'](X_dt))
        if verbose:
            print("Y_d_nt done")

        self.Y_t_dn = self.second_learner['n'].fit_transform(scl['n'](X_tn))
        if verbose:
            print("Y_t_dn done")

        self.Y_d_tn = self.second_learner['n'].fit_transform(scl['n'](
            X_nd.transpose()))
        if verbose:
            print("Y_d_tn done")

        self.Y_t_nd = self.second_learner['d'].fit_transform(scl['d'](
            X_dt.transpose()))
        if verbose:
            print("Y_t_nd done")

        self.Y_n_td = self.second_learner['d'].fit_transform(scl['d'](X_nd))
        if verbose:
            print("Y_n_td done")

        if verbose:
            print("second repr done")

    def set_first_learner(self, first_learner):
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

    def set_second_learner(self, second_learner):
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
