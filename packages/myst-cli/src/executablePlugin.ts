import type { ISession } from './session/types.js';
import {
  type MystPlugin,
  type DirectiveSpec,
  type RoleSpec,
  type TransformSpec,
  type GenericNode,
  type GenericParent,
} from 'myst-common';
import { spawn, spawnSync } from 'node:child_process';

type DirectiveJSONSpec = Omit<DirectiveSpec, 'run' | 'validate'>;
type RoleJSONSpec = Omit<RoleSpec, 'run' | 'validate'>;
type TransformJSONSpec = Omit<TransformSpec, 'plugin'>;
type ExecutableSpec = Omit<MystPlugin, 'directives' | 'roles' | 'transforms'> & {
  directives?: DirectiveJSONSpec[];
  roles?: RoleJSONSpec[];
  transforms?: TransformJSONSpec[];
};

function executeSyncParser(
  session: ISession,
  name: string,
  data: Record<string, unknown>,
  path: string,
  kind: string,
): GenericNode[] {
  const { stdout, status, stderr } = spawnSync(path, [`--${kind}`, name], {
    input: JSON.stringify(data),
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (status) {
    throw new Error(
      `Non-zero error code after running executable "${path}" during execution of ${kind} '${name}'\n\n${stderr}`,
    );
  } else {
    if (stderr.length) {
      session.log.debug(`\n\n${stderr}\n\n`);
    }
    return JSON.parse(stdout);
  }
}

async function executeAsyncParser(
  session: ISession,
  name: string,
  data: Record<string, unknown>,
  path: string,
  kind: string,
) {
  const proc = spawn(path, [`--${kind}`, name]);

  // Pass in the data
  proc.stdin.write(JSON.stringify(data));
  proc.stdin.end();

  // Read out the stdout in chunks
  const stdoutBuffers: Buffer[] = [];
  proc.stdout.on('data', (chunk) => {
    stdoutBuffers.push(chunk);
  });
  // Read out the stderr in chunks
  const stderrBuffers: Buffer[] = [];
  proc.stderr.on('data', (chunk) => {
    stderrBuffers.push(chunk);
  });

  // Await exit
  const exitCode = await new Promise((resolve) => {
    proc.on('close', (code) => resolve(code));
  });

  // Did the process fail?
  if (exitCode) {
    const stderr = Buffer.concat(stderrBuffers).toString();
    throw new Error(
      `Non-zero error code after running executable "${path}" during execution of ${kind} '${name}'\n\n${stderr}`,
    );
  } else if (stderrBuffers.length) {
    const stderr = Buffer.concat(stderrBuffers).toString();
    // Log the error
    session.log.debug(`\n\n${stderr}\n\n`);
  }

  // Concatenate the responses
  const stdout = Buffer.concat(stdoutBuffers).toString();
  return JSON.parse(stdout);
}

function wrapDirective(
  session: ISession,
  directive: DirectiveJSONSpec,
  path: string,
): DirectiveSpec {
  return {
    ...directive,
    run: (data) => {
      return executeSyncParser(session, directive.name, data, path, 'directive');
    },
  };
}

function wrapRole(session: ISession, role: RoleJSONSpec, path: string): RoleSpec {
  return {
    ...role,
    run: (data) => {
      return executeSyncParser(session, role.name, data, path, 'role');
    },
  };
}

function wrapTransform(
  session: ISession,
  transform: TransformJSONSpec,
  path: string,
): TransformSpec {
  return {
    ...transform,
    plugin: () => {
      return async (node: GenericParent) => {
        // Modify the tree in-place
        const result = await executeAsyncParser(session, transform.name, node, path, 'transform');
        Object.assign(node, result);
      };
    },
  };
}

export async function loadExecutablePlugin(
  session: ISession,
  path: string,
): Promise<MystPlugin | undefined> {
  const proc = spawn(path, []);
  // Read out the stdout in chunks
  const stdoutBuffers: Buffer[] = [];
  proc.stdout.on('data', (chunk) => {
    stdoutBuffers.push(chunk);
  });
  // Read out the stderr in chunks
  const stderrBuffers: Buffer[] = [];
  proc.stderr.on('data', (chunk) => {
    stderrBuffers.push(chunk);
  });

  // Await exit
  const exitCode = await new Promise((resolve) => {
    proc.on('close', (code) => resolve(code));
  });

  if (exitCode) {
    // Log the error
    const stderr = Buffer.concat(stderrBuffers).toString();
    session.log.debug(`\n\n${stderr}\n\n`);

    return undefined;
  }

  // Concatenate the responses
  const stdout = Buffer.concat(stdoutBuffers).toString();

  // Return the wrapped specification
  const spec: ExecutableSpec = JSON.parse(stdout);
  return {
    ...spec,
    directives: (spec.directives ?? []).map((directive: DirectiveJSONSpec) =>
      wrapDirective(session, directive, path),
    ),
    roles: (spec.roles ?? []).map((role: RoleJSONSpec) => wrapRole(session, role, path)),
    transforms: (spec.transforms ?? []).map((transform: TransformJSONSpec) =>
      wrapTransform(session, transform, path),
    ),
  };
}
