/** A QueryProfileInfo contains information about planning, execution, and results of a query. */
import {
  AggregateQuerySnapshot,
  AggregateSpec,
  DocumentData,
  QuerySnapshot,
} from '@google-cloud/firestore';

export interface QueryProfileInfo<T extends DocumentData> {
  /**
   * A Map that contains information about the query plan.
   * Contents are subject to change.
   */
  readonly plan: Record<string, unknown>;

  /**
   * A Map that contains statistics about the execution of the query.
   * Contents are subject to change.
   */
  readonly stats: Record<string, unknown>;

  /**
   * The snapshot that contains the results of executing the query.
   */
  readonly snapshot: QuerySnapshot<T>;
}

/**
 * An AggregateQueryProfileInfo contains information about planning,
 * execution, and results of an aggregate query.
 */
export interface AggregateQueryProfileInfo<T extends AggregateSpec> {
  /**
   * A Map that contains information about the query plan.
   * Contents are subject to change.
   */
  readonly plan: Record<string, unknown>;

  /**
   * A Map that contains statistics about the execution of the aggregate query.
   * Contents are subject to change.
   */
  readonly stats: Record<string, unknown>;

  /**
   * The snapshot that contains the results of executing the aggregate query.
   */
  readonly snapshot: AggregateQuerySnapshot<T>;
}
