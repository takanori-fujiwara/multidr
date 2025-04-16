## MulTiDR: A Visual Analytics Framework for Reviewing Multivariate Time-Series Data with Dimensionality Reduction

New
-----
* Now, MulTiDR is available from all major OSs, Mac OS, Linux, and Windows (but the websocket server implementation used for the web UI is beta for Windows)

About
-----
* MulTiDR is from: Fujiwara et al., "A Visual Analytics Framework for ReviewingMultivariate Time-Series Data with Dimensionality Reduction." IEEE Transactions on Visualization and Computer Graphics, vol. 27, no. 2, pp. 1601-1611, 2021.

* Implementation of MulTiDR back-end algorithms
 * Two-step DR (TDR): Framework of dimensionality reduction for multivariate time-series data. TDR produces a low-dimensional representation from a third-order tensor.
 * Contrastive learning with sign adjustment of feature contributions.

* Implementation of MulTiDR Visual Interface.

* Demonstration video of a system using MulTiDR: https://takanori-fujiwara.github.io/s/multidr/

******

Back-End Library Setup
-----

### Requirements
* Python3
* Note: Tested on macOS Sequoia, Ubuntu 22.0.4 LTS, and Windows 10.

### Setup
* Install with pip3. Move to the directory of this repository. Then,

    `pip3 install .`

* If you want to use contrastive learning with a default setting (i.e., use of ccPCA), install ccPCA from: https://github.com/takanori-fujiwara/ccpca

### Usage
* Import installed modules from python (e.g., `from multidr.tdr import TDR`). See `sample.py` for examples.
* For detailed documentations, please see `doc/index.html` or directly see comments in `multidr/tdr.py` and `multidr/cl.py`.

******

Web-based Visual Interface Setup
-----

### Requirements
* Server side
  * Python3
  * HTTP Server
* Client side
  * Browser supporting JavaScript ES2015(ES6) and WebGL 2.0.
  * Internet connection (to access D3 library)

* Note: Tested on macOS Ventura, Ubuntu 22.0.4 LTS, and Windows 10.


### Server Setup

* Install `multidr` and `ccpca` modules based on "Back-End Library Setup"

* Move to `ui/server/` of this repository. Then,

    `pip3 install -r requirements.txt`

  (This intalls numpy, scipy, uvloop, websockets)

* Run websocket server:

    `python3 ws_server.py` or  `python ws_server.py`

* Run http server. For example, move to `ui/client/` of this repository. Then,

    `python3 -m http.server` or  `python -m http.server`

### Client Setup

* Access to the url setup in the http server. For example, if you set an http server with the above command. You can acess with: `http://localhost:8000/`

### How to Include New Datasets

* Please, refer to `ui/doc/data_format.md`

******

## How to Cite
Please, cite:    
Takanori Fujiwara, Shilpika, Naohisa Sakamoto, Jorji Nonaka, Keiji Yamamoto, and Kwan-Liu Ma, "A Visual Analytics Framework for ReviewingMultivariate Time-Series Data with Dimensionality Reduction". IEEE Transactions on Visualization and Computer Graphics, vol. 27, no. 2, pp. 1601-1611, 2021.
