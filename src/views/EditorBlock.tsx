import { keyBy, pull, uniqBy } from "lodash";
import React, { FC, useContext, useMemo } from "react";
import Select from "react-select";
import { RiFilterFill } from "react-icons/ri";
import { MdBubbleChart } from "react-icons/md";
import { BsGearFill, BsPaletteFill, BsShare } from "react-icons/bs";

import { AppContext, GraphContext } from "../lib/context";
import { DEFAULT_SELECT_PROPS } from "../lib/consts";
import {
  DEFAULT_EDGE_COLORING,
  DEFAULT_EDGE_DIRECTION,
  EDGE_COLORING_MODES,
  EDGE_DIRECTION_MODES,
  EdgeColoring,
  EdgeDirection,
  NavState,
} from "../lib/navState";

const EDGE_COLORING_LABELS: Record<EdgeColoring, JSX.Element> = {
  s: <div className="p-1">Use source node color</div>,
  t: <div className="p-1">Use target node color</div>,
  o: <div className="p-1">Use original color</div>,
  c: (
    <div className="p-1">
      Color all edges as grey
      <div className="text-muted">
        <small>(can be useful to keep the user focus on nodes)</small>
      </div>
    </div>
  ),
};

const EDGE_DIRECTION_LABELS: Record<EdgeDirection, JSX.Element> = {
  o: <div className="p-1">Trust the original graph file</div>,
  d: (
    <div className="p-1">
      All edges should be treated as <strong>directed</strong>
    </div>
  ),
  u: (
    <div className="p-1">
      All edges should be treated as <strong>undirected</strong>
    </div>
  ),
};

interface Option {
  value: string;
  label: string;
  field?: string;
}

const EditorBlock: FC = () => {
  const { navState, data, setNavState, openModal } = useContext(GraphContext);
  const { portalTarget } = useContext(AppContext);
  const { fields, fieldsIndex } = data;
  const { filterable, colorable, sizeable, subtitleFields } = navState;

  const edgeColoring = navState.edgeColoring || DEFAULT_EDGE_COLORING;
  const edgeDirection = navState.edgeDirection || DEFAULT_EDGE_DIRECTION;

  const sizeableSet = new Set<string>(sizeable);
  const colorableSet = new Set<string>(colorable);
  const filterableSet = new Set<string>(filterable);

  const sets: Record<string, Set<string>> = {
    sizeable: sizeableSet,
    colorable: colorableSet,
    filterable: filterableSet,
  };

  const subtitleOptions: Option[] = useMemo(
    () =>
      uniqBy(
        fields.map((key) => {
          const field = fieldsIndex[key];
          return {
            value: `${key}-field`,
            label: field.label,
            field: key,
          };
        }),
        ({ field }) => fieldsIndex[field].rawFieldId,
      ),
    [fields, fieldsIndex],
  );
  const optionsIndex = keyBy(subtitleOptions, "field");
  const selectedOptions = (subtitleFields || []).map((f) => optionsIndex[f]);

  return (
    <div className="editor-block bg-info block">
      <h1 className="fs-4 mt-4">
        <BsGearFill /> Graph visualization edition
      </h1>

      <br />

      <p>
        Before sharing your graph online, you can first select various options on how users will{" "}
        <strong>read and interrogate</strong> this graph.
      </p>
      <p>
        Your choices in this panel will impact the next white panel, which is the interface your users will have access
        to.
      </p>
      {!navState.local && (
        <p>
          Once you are satisfied with your choices, click the{" "}
          <button
            type="button"
            className="btn btn-outline-dark btn-sm btn-inline mx-1"
            onClick={() => openModal("share")}
          >
            <small>
              <BsShare />
            </small>{" "}
            Share
          </button>{" "}
          button to <strong>share or embed</strong> this graph.
        </p>
      )}

      <hr />

      <div className="mb-3">
        <h3 className="form-label fs-6">Which fields should be actionable?</h3>

        <table className="table">
          <thead>
            <tr>
              <th scope="col" className="text-nowrap w-1">
                <span className="d-flex align-items-center">
                  <RiFilterFill className="me-1" /> Filter
                </span>
              </th>
              <th scope="col" className="text-nowrap w-1">
                <span className="d-flex align-items-center">
                  <BsPaletteFill className="me-1" /> Colors
                </span>
              </th>
              <th scope="col" className="text-nowrap w-1">
                <span className="d-flex align-items-center">
                  <MdBubbleChart className="me-1" /> Sizes
                </span>
              </th>
              <th />
            </tr>
          </thead>

          <tbody>
            {fields.map((f) => {
              const field = fieldsIndex[f];

              return (
                <tr key={f}>
                  {["filterable", "colorable", "sizeable"].map((key) => {
                    const colorOrSize = sizeableSet.has(f) || colorableSet.has(f);
                    const disabled =
                      (key === "filterable" && colorOrSize) ||
                      (key === "sizeable" && field.type !== "quanti") ||
                      (key === "colorable" && field.type !== "quali" && field.type !== "quanti");
                    const checked = sets[key].has(f) || (key === "filterable" && colorOrSize);
                    const keyToUpdate = {
                      sizeable: "size",
                      colorable: "color",
                    }[key];

                    return (
                      <td key={key} className="align-middle text-center">
                        <input
                          className="flex-shrink-0"
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={(e) =>
                            setNavState({
                              ...navState,
                              [key]: e.target.checked
                                ? ((navState as any)[key] || []).concat(f)
                                : pull((navState as any)[key] || [], f),
                              ...(e.target.checked && keyToUpdate ? { [keyToUpdate]: f } : {}),
                            })
                          }
                        />
                      </td>
                    );
                  })}
                  <td className="line-height-1">
                    {field.label}
                    {field.typeLabel && <div className="text-muted">{field.typeLabel}</div>}
                  </td>
                </tr>
              );
            })}
            <tr>
              <td />
              {["colorable", "sizeable"].map((key, i) => {
                const keyToUpdate = (
                  {
                    sizeable: "disableDefaultSize",
                    colorable: "disableDefaultColor",
                  } as Record<string, keyof NavState>
                )[key];
                const disabled = ((navState as any)[key] || []).length < 1;
                const checked = !navState[keyToUpdate];

                return (
                  <td key={key} className="align-middle text-center">
                    <input
                      className="flex-shrink-0"
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={(e) => setNavState({ ...navState, [keyToUpdate]: !e.target.checked })}
                    />
                  </td>
                );
              })}
              <td className="line-height-1 text-muted">Allow using default graph file colors and/or sizes</td>
            </tr>
          </tbody>
        </table>
      </div>

      <br />

      <div className="mb-3">
        <label className="form-label" htmlFor="hovered-fields-input">
          <h3 className="form-label fs-6">Which node information should show up on hovered nodes?</h3>
        </label>
        <Select
          {...DEFAULT_SELECT_PROPS}
          isMulti
          inputId="hovered-fields-input"
          menuPortalTarget={portalTarget}
          options={subtitleOptions}
          value={selectedOptions}
          onChange={(v) => setNavState({ ...navState, subtitleFields: v.map((o) => o.field) as string[] })}
          isDisabled={subtitleOptions.length < 1}
          placeholder="Select fields..."
        />
      </div>

      <br />

      <div className="mb-3">
        <label className="form-label" htmlFor="edge-coloring-input">
          <h3 className="form-label fs-6">How should the edges be colored?</h3>
        </label>
        <Select<{ value: EdgeColoring; label: JSX.Element }>
          {...DEFAULT_SELECT_PROPS}
          inputId="edge-coloring-input"
          menuPortalTarget={portalTarget}
          options={EDGE_COLORING_MODES.map((v) => ({ value: v, label: EDGE_COLORING_LABELS[v] }))}
          value={{ value: edgeColoring, label: EDGE_COLORING_LABELS[edgeColoring] }}
          onChange={(o) => o && setNavState({ ...navState, edgeColoring: o.value })}
          formatOptionLabel={(o) => o?.label}
          styles={{
            option: (provided, state) => {
              return {
                ...provided,
                background: state.isSelected ? "#f0f0f0" : state.isFocused ? "#f9f9f9" : provided.background,
                color: undefined,
              };
            },
          }}
        />
      </div>

      <br />

      <div className="mb-3">
        <label className="form-label" htmlFor="edge-direction-input">
          <h3 className="form-label fs-6">What are the edge directions?</h3>
        </label>
        <Select<{ value: EdgeDirection; label: JSX.Element }>
          {...DEFAULT_SELECT_PROPS}
          inputId="edge-direction-input"
          menuPortalTarget={portalTarget}
          options={EDGE_DIRECTION_MODES.map((v) => ({ value: v, label: EDGE_DIRECTION_LABELS[v] }))}
          value={{ value: edgeDirection, label: EDGE_DIRECTION_LABELS[edgeDirection] }}
          onChange={(o) => o && setNavState({ ...navState, edgeDirection: o.value })}
          formatOptionLabel={(o) => o?.label}
          styles={{
            option: (provided, state) => {
              return {
                ...provided,
                background: state.isSelected ? "#f0f0f0" : state.isFocused ? "#f9f9f9" : provided.background,
                color: undefined,
              };
            },
          }}
        />
      </div>
    </div>
  );
};

export default EditorBlock;
