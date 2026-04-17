FROM python:3.11-slim as builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    gcc \
    libssl-dev \
    pkg-config \
    git \
    make

# Build liboqs from source
RUN git clone -b 0.10.0 https://github.com/open-quantum-safe/liboqs.git \
    && cd liboqs \
    && mkdir build && cd build \
    && cmake -DOQS_USE_OPENSSL=ON \
             -DOPENSSL_ROOT_DIR=/usr \
             -DBUILD_SHARED_LIBS=ON \
             -DOQS_BUILD_ONLY_LIB=ON \
             -DOQS_DIST_BUILD=ON .. \
    && make -j$(nproc) && make install

FROM python:3.11-slim

# Copy compiled liboqs
COPY --from=builder /usr/local/lib/liboqs.so* /usr/local/lib/
COPY --from=builder /usr/local/include/oqs /usr/local/include/oqs
RUN ldconfig

WORKDIR /app

# Install python dependencies
COPY requirements.txt .
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/* \
    && pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Environment variables
ENV LD_LIBRARY_PATH=/usr/local/lib:$LD_LIBRARY_PATH

# Expose port (Railway provides PORT env variable)
ENV PORT=8000
EXPOSE $PORT

# Run GovSign by default
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port $PORT"]
