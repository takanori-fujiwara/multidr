## Required files
* Client side (ui/client/data)
  - DATANAME.json
  - file_list.json

* Server side (ui/server/data)
  - DATANAME_Y_dt.npy
  - DATANAME_Y_nd.npy
  - DATANAME_Y_tn.npy

## File Content Description

* You can see a file generation example in sample_ui_data_gen.py in the parent dir of this repository.

* Also, you can see other examples in ui/client/data and ui/sever/data.

* ui/client/data/DATANAME.json
  -  siViewInfo [Object] (optional): Which predefined view wants to use as the SI View
      - instance [String] (optional): Prefered SI view for instances (e.g., 'map')
      - variable [String] (optional): Prefered SI view for variables (e.g., 'default')
      - time [String] (optional): Prefered SI view for variables (e.g., 'clock')
  - instances [Object]: Instance data information
    - Z_n_dt [Object]: Instance embedding information
      - n [int]: Instance ID
      - embPos [array of 2 floats]: the two-step DR position in 2D in a range of -1 and 1
      - name [String] (optional): Instance's name
      - aux [Object] (optional): Auxiliary information for the SI view
        - x [float] (optional): x-coordinate
        - y [float] (optional): y-coordinate
      - (Also, other information can include here)
    - Z_n_td [Object]: Instance embedding information
      - n [int]: Instance ID
      - embPos [array of 2 floats]: the two-step DR position in 2D in a range of -1 and 1
      - name [String] (optional): Instance's name
      - aux [Object] (optional): Auxiliary information for the SI view
        - x [float] (optional): x-coordinate
        - y [float] (optional): y-coordinate
      - (Also, other information can include here)
  - variables [Object]: Variable data information
    - Z_d_tn [Object]: Variable embedding information
      - d [int]: Variable ID
      - embPos [array of 2 floats]: the two-step DR position in 2D in a range of -1 and 1
      - name [String] (optional): Variable's name
      - (Also, other information can include here)
    - Z_d_nt [Object]: Variable embedding information
      - d [int]: Variable ID
      - embPos [array of 2 floats]: the two-step DR position in 2D in a range of -1 and 1
      - name [String] (optional): Variable's name
      - (Also, other information can include here)
  - timePoints [Object]: Time-point data information
    - Z_t_dn [Object]: Time-point embedding information
      - t [int]: Time-point ID
      - embPos [array of 2 floats]: the two-step DR position in 2D in a range of -1 and 1
      - time [String] (optional): time information
      - (Also, other information can include here)
    - Z_t_nd [Object]: Time-point embedding information
      - t [int]: Time-point ID
      - embPos [array of 2 floats]: the two-step DR position in 2D in a range of -1 and 1
      - time [String] (optional): time information
      - (Also, other information can include here)
  - firstDrInfo [Object]: Information related to the first DR step
    - explainedVarianceRatio [Object]: explained variance ratio for each mode
      - n [float]: The ratio for an instance mode
      - d [float]: The ratio for a variable mode
      - t [float]: The ratio for a time mode
    - components [Object]: principal components for each mode
      - n [2D array shape of (n_instances, 2)]: The components for an instance mode
      - d [2D array shape of (n_variables, 2)]: The components for a variable mode
      - t [2D array shape of (n_time_points, 2)]: The components for a time mode

* ui/client/data/file_list.json
  - fileNames [array of strings]: file names you want to include in the drop-down list

* ui/server/data/DATANAME_Y_dt.npy, DATANAME_Y_nd.npy, DATANAME_Y_tn.npy
  - npy array objects obtained by using the two-step DR
