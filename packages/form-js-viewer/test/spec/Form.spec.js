import {
  createForm,
  schemaVersion
} from '../../src';

import { spy } from 'sinon';

import customModule from './custom';

import disabledSchema from './disabled.json';
import schema from './form.json';
import textSchema from './text.json';

import {
  insertCSS,
  isSingleStart
} from '../TestHelper';

// @ts-ignore-next-line
import customCSS from './custom/custom.css';

insertCSS('custom.css', customCSS);

const singleStart = isSingleStart('basic');


describe('createForm', function() {

  let container;

  beforeEach(function() {
    container = document.createElement('div');

    document.body.appendChild(container);
  });

  !singleStart && afterEach(function() {
    document.body.removeChild(container);
  });


  it('should expose schemaVersion', function() {
    expect(typeof schemaVersion).to.eql('number');
  });


  (singleStart ? it.only : it)('should render', async function() {

    // given
    const data = {
      creditor: 'John Doe Company',
      amount: 456,
      invoiceNumber: 'C-123',
      approved: true,
      approvedBy: 'John Doe',
      product: 'camunda-cloud',
      language: 'english',
      documents: [
        {
          title: 'invoice.pdf',
          author: 'John Doe'
        },
        {
          title: 'products.pdf'
        }
      ]
    };

    // when
    const form = await createForm({
      container,
      data,
      schema
    });

    form.on('changed', ({ data, errors }) => console.log(data, errors));

    // then
    expect(form).to.exist;
    expect(form.reset).to.exist;
    expect(form.submit).to.exist;
    expect(form._update).to.exist;
  });


  it('should render complex text', async function() {

    // when
    const form = await createForm({
      container,
      schema: textSchema
    });

    // then
    expect(form).to.exist;
  });


  it('#destroy', async function() {

    // given
    const form = await createForm({
      container,
      schema
    });

    // when
    form.destroy();

    // then
    expect(container.childNodes).to.be.empty;
  });


  it('#validate', async function() {

    // given
    const form = await createForm({
      container,
      schema
    });

    // when
    const errors = form.validate();

    // then
    expect(errors).to.eql({
      creditor: [
        'Field is required.'
      ]
    });
  });


  it('should throw error on submit if disabled', async function() {

    // given
    const data = {
      creditor: 'John Doe Company',
      amount: 456,
      invoiceNumber: 'C-123',
      approved: true,
      approvedBy: 'John Doe'
    };

    // when
    const form = await createForm({
      container,
      data,
      schema,
      properties: {
        readOnly: true
      }
    });

    // when
    let error;

    try {
      form.submit();
    } catch (_error) {
      error = _error;
    }

    // then
    expect(error).to.exist;
    expect(error.message).to.eql('form is read-only');
  });


  it('should not submit disabled fields', async function() {

    // given
    const data = {
      amount: 456,
      invoiceNumber: 'C-123',
      approved: true,
      approvedBy: 'John Doe'
    };

    // when
    const form = await createForm({
      container,
      data,
      schema: disabledSchema
    });

    // when
    const submission = form.submit();

    // then
    expect(submission.data).not.to.have.property('creditor');
    expect(submission.errors).not.to.have.property('creditor');
  });


  it('should not validate disabled fields', async function() {

    // given
    const data = {
      amount: 456,
      invoiceNumber: 'C-123',
      approved: true,
      approvedBy: 'John Doe'
    };

    // when
    const form = await createForm({
      container,
      data,
      schema: disabledSchema
    });

    // when
    const errors = form.validate();

    // then
    expect(errors).not.to.have.property('creditor');
  });


  it('should attach', async function() {

    // given
    const data = {
      creditor: 'John Doe Company',
      amount: 456,
      invoiceNumber: 'C-123',
      approved: true,
      approvedBy: 'John Doe',
      product: 'camunda-cloud',
      language: 'english'
    };

    // when
    const form = await createForm({
      data,
      schema
    });

    // assume
    expect(form._container.parentNode).not.to.exist;

    // when
    form.attachTo(container);

    // then
    expect(form._container.parentNode).to.exist;
  });


  it('should detach', async function() {

    // given
    const data = {
      creditor: 'John Doe Company',
      amount: 456,
      invoiceNumber: 'C-123',
      approved: true,
      approvedBy: 'John Doe',
      product: 'camunda-cloud',
      language: 'english'
    };

    // when
    const form = await createForm({
      container,
      data,
      schema
    });

    // assume
    expect(form._container.parentNode).to.exist;

    // when
    form.detach();

    // then
    expect(form._container.parentNode).not.to.exist;
  });


  it('should be customizable', async function() {

    // given
    const data = {
      creditor: 'John Doe Company',
      amount: 456,
      invoiceNumber: 'C-123',
      approved: true,
      approvedBy: 'John Doe',
      product: 'camunda-cloud',
      language: 'english'
    };

    // when
    await createForm({
      container,
      data,
      schema,
      additionalModules: [
        customModule
      ]
    });

    // then
    expect(document.querySelector('.custom-button')).to.exist;
  });


  it('should update, reset and submit', async function() {

    // given
    const data = {
      creditor: 'John Doe Company',
      amount: 456,
      invoiceNumber: 'C-123',
      approved: true,
      approvedBy: 'John Doe'
    };

    // when
    const form = await createForm({
      container,
      data,
      schema
    });

    const field = Array.from(form.get('formFieldRegistry').values()).find(({ key }) => key === 'creditor');

    // update programmatically
    form._update({
      field,
      value: 'Jane Doe Company'
    });

    // when submit
    const submission = form.submit();

    // then
    expect(submission.data).to.eql({
      creditor: 'Jane Doe Company',
      amount: 456,
      invoiceNumber: 'C-123',
      approved: true,
      approvedBy: 'John Doe'
    });

    expect(submission.errors).to.eql({});

    // when reset
    form.reset();

    const state = form._getState();

    // then
    expect(state.data).to.eql(data);
    expect(state.errors).to.be.empty;
  });


  it('should emit <changed>', async function() {

    // given
    const data = {
      creditor: 'John Doe Company',
      amount: 456,
      invoiceNumber: 'C-123',
      approved: true,
      approvedBy: 'John Doe'
    };

    const form = await createForm({
      container,
      data,
      schema
    });

    const changedListener = spy(function(event) {

      expect(event.data).to.exist;
      expect(event.errors).to.exist;
      expect(event.properties).to.exist;
      expect(event.schema).to.exist;

      expect(event.data.creditor).to.eql('Jane Doe Company');
    });

    form.on('changed', changedListener);

    // when
    const field = Array.from(form.get('formFieldRegistry').values()).find(({ key }) => key === 'creditor');

    form._update({
      field,
      value: 'Jane Doe Company'
    });

    // then
    expect(changedListener).to.have.been.calledOnce;
  });


  it('should emit <submit>', async function() {

    // given
    const data = {
      amount: 456
    };

    const form = await createForm({
      container,
      data,
      schema
    });

    const submitListener = spy(function(event) {

      expect(event.data).to.exist;
      expect(event.errors).to.exist;

      expect(event.errors).to.eql({
        creditor: [ 'Field is required.' ]
      });

      expect(event.data).to.eql(data);
    });

    form.on('submit', submitListener);

    // when
    form.submit();
  });


  it('should fail instantiation with import error', async function() {

    // given
    const data = {
      amount: 456
    };

    const schema = {
      type: 'default',
      components: [
        {
          type: 'unknown-component'
        }
      ]
    };

    let error;

    // when
    try {
      await createForm({
        container,
        data,
        schema
      });
    } catch (_error) {
      error = _error;
    }

    // then
    expect(error).to.exist;
    expect(error.message).to.eql('form field of type <unknown-component> not supported');
  });

});