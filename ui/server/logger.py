import logging
import os
import os.path
import time


def make_logger(log_file_name='', output_console=True):
    os.makedirs('log', exist_ok=True)

    formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    logger = logging.getLogger(log_file_name)
    logger.setLevel(logging.DEBUG)

    file_path = 'log/' + log_file_name + '-{}.log'.format(
        time.strftime('%Y-%m-%d-%H-%M-%S'))
    file_handler = logging.FileHandler(file_path)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    if output_console:
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)

    return logger


logger = make_logger()
