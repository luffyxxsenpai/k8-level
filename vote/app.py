from flask import Flask, render_template, request, make_response, g
from redis import Redis
import os
import socket
import random
import json
import logging

# Default options
option_a = os.getenv('OPTION_A', "Cats")
option_b = os.getenv('OPTION_B', "Dogs")
hostname = socket.gethostname()

# Redis connection details from environment variables
redis_host = os.getenv('REDIS_HOST', 'redis')
redis_port = int(os.getenv('REDIS_PORT', 6379))
redis_db = int(os.getenv('REDIS_DB', 0))
redis_socket_timeout = int(os.getenv('REDIS_SOCKET_TIMEOUT', 5))

# Control whether to print environment info
env_info = os.getenv('ENV_INFO', 'no').lower() == 'yes'

app = Flask(__name__)

gunicorn_error_logger = logging.getLogger('gunicorn.error')
app.logger.handlers.extend(gunicorn_error_logger.handlers)
app.logger.setLevel(logging.INFO)

def get_redis():
    """Establish and return a Redis connection."""
    if not hasattr(g, 'redis'):
        g.redis = Redis(
            host=redis_host,
            port=redis_port,
            db=redis_db,
            socket_timeout=redis_socket_timeout
        )
    return g.redis

@app.route("/", methods=['POST', 'GET'])
def hello():
    """Handle the main voting logic."""
    voter_id = request.cookies.get('voter_id')
    if not voter_id:
        voter_id = hex(random.getrandbits(64))[2:-1]

    vote = None

    if request.method == 'POST':
        redis = get_redis()
        vote = request.form['vote']
        app.logger.info('Received vote for %s', vote)
        data = json.dumps({'voter_id': voter_id, 'vote': vote})
        redis.rpush('votes', data)

    resp = make_response(render_template(
        'index.html',
        option_a=option_a,
        option_b=option_b,
        hostname=hostname,
        vote=vote,
    ))
    resp.set_cookie('voter_id', voter_id)
    return resp

if __name__ == "__main__":
    if env_info:
        print(f"""
        Flask Voting App
        -----------------
        Running on: http://0.0.0.0:8080
        Environment:
          - OPTION_A: {option_a}
          - OPTION_B: {option_b}
          - Redis Host: {redis_host}
          - Redis Port: {redis_port}
          - Redis DB: {redis_db}
          - ENV_INFO: {os.getenv('ENV_INFO', 'no')}
        """)
    app.run(host='0.0.0.0', port=8080, debug=True, threaded=True)

