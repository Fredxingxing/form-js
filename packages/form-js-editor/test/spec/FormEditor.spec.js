import { createFormEditor } from '../../src';

import { expect } from 'chai';

import { waitFor } from '@testing-library/preact/pure';

import {
  insertStyles,
  isSingleStart
} from '../TestHelper';

import schema from './form.json';

// import schema from './empty.json';

insertStyles();

const singleStart = isSingleStart('basic');


describe('createFormEditor', function() {

  let container;

  beforeEach(function() {
    container = document.createElement('div');

    container.style.height = '100%';

    document.body.appendChild(container);
  });

  !singleStart && afterEach(function() {
    document.body.removeChild(container);
  });

  (singleStart ? it.only : it)('should render', async function() {

    // given
    const formEditor = await waitForFormEditorCreated({
      container,
      schema
    });

    formEditor.on('change', event => {
      console.log('Form Editor <change>', event);
    });
  });


  it('should expose schema', async function() {

    // given
    const formEditor = await waitForFormEditorCreated({
      container,
      schema
    });

    // when
    const exportedSchema = formEditor.getSchema();

    // then
    expect(exportedSchema).to.exist;

    expect(JSON.stringify(exportedSchema)).not.to.contain('"id"');
  });


  it('should add field', async function() {

    // given
    const formEditor = await waitForFormEditorCreated({
      schema,
      container
    });

    // when
    const index = 1;

    const field = {
      id: 'foo',
      type: 'button'
    };

    const registeredField = Object.values(formEditor.fields.getAll()).find(({ type }) => type === 'default');

    formEditor.addField(registeredField, index, field);

    formEditor.on('change', event => {
      console.log('Form Editor <change>', event);
    });
  });

});

async function waitForFormEditorCreated(options) {
  const form = createFormEditor(options);

  await waitFor(() => {
    expect(Object.keys(form.fields.getAll())).to.have.length(8);
  });

  return form;
}