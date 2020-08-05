import numpy as np
import copy
from sklearn.decomposition import PCA
from sklearn import preprocessing
from umap import UMAP


class TDR():
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

    def learn_second_repr(self, Y_tn, Y_nd, Y_dt, scaling=True, verbose=False):
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
        self.Z_n_dt = self.second_learner['t'].fit_transform(scl['t'](
            Y_tn.transpose()))
        if verbose:
            print("Z_n_dt done")

        self.Z_d_nt = self.second_learner['t'].fit_transform(scl['t'](Y_dt))
        if verbose:
            print("Z_d_nt done")

        self.Z_t_dn = self.second_learner['n'].fit_transform(scl['n'](Y_tn))
        if verbose:
            print("Z_t_dn done")

        self.Z_d_tn = self.second_learner['n'].fit_transform(scl['n'](
            Y_nd.transpose()))
        if verbose:
            print("Z_d_tn done")

        self.Z_t_nd = self.second_learner['d'].fit_transform(scl['d'](
            Y_dt.transpose()))
        if verbose:
            print("Z_t_nd done")

        self.Z_n_td = self.second_learner['d'].fit_transform(scl['d'](Y_nd))
        if verbose:
            print("Z_n_td done")

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
