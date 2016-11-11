import * as restify from 'restify';
import ListenableAdapter from '../listenable-adapter';
import queryParser from './middlewares/restify-query-parser';
import { FatalError, ISLAND } from '../../utils/error';

export interface RestifyAdapterOptions {
  serverOptions?: restify.ServerOptions;
  port: number;
}

/**
 * RestifyAdapter
 * @class
 * @extends ListenableAdapter
 */
export default class RestifyAdapter extends ListenableAdapter<restify.Server, RestifyAdapterOptions> {
  /**
   * Initialize the restify server.
   * @override
   * @returns {Promise<void>}
   */
  public initialize() {
    if (!this.options) throw new FatalError(ISLAND.FATAL.F0025_MISSING_ADAPTER_OPTIONS);
    let options = this.options;
    let server = restify.createServer(options.serverOptions || {});

    // Cleans up sloppy URLs on the request object, like /foo////bar/// to /foo/bar.
    // ex) /v2/a/b/ => /v2/a/b
    server.pre(restify.pre.sanitizePath());

    server.use(restify.dateParser());
    server.use(queryParser());
    server.use(restify.bodyParser({
      // TODO: export below params to external configuation file
      maxBodySize: 0,
      // https://github.com/restify/node-restify/issues/789 <- 
      mapParams: false
    }));

    this._adaptee = server;
  }

  /**
   * Listen the restify server.
   * @override
   * @returns {Promise<void>}
   */
  public listen() {
    return new Promise<void>((resolve, reject) => {
      if (!this.options) throw new FatalError(ISLAND.FATAL.F0025_MISSING_ADAPTER_OPTIONS);
      this.adaptee.listen(this.options.port, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  }

  public destroy() {
    return super.destroy();
  }
}
