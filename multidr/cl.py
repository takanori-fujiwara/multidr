import numpy as np
from scipy.stats import pearsonr

from ccpca import CCPCA


class CL():
    def __init__(self, learner=None):
        self.learner = None
        self.fcs = None
        self.set_learner(learner)

    def fit(self, K, R, **contrast_learner_kwargs):
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
        if learner is None:
            self.learner = CCPCA()
        else:
            self.learner = learner
